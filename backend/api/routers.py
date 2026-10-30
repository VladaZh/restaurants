from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from prometheus_client import Counter
from sqlalchemy import text

from api.rules import validate_working_hours
from db.exceptions import CreateReservationException
from db.reservations_repo import ReservationsRepo
from db.session import get_db
from api.models import FormRequest, FormResponse
from falls import apply_chaos
from logger import logger
from metrics import (
    reservations_rejected_total,
    reservations_created_total,
    reservation_guests,
)

router = APIRouter()
orders_created_total = Counter("orders_created_total", "Created orders")


@router.post(
    path="/send-form/",
    response_model=FormResponse,
    summary="Отправить форму",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(apply_chaos)],
)
def send_form(reservation: FormRequest, db: Session = Depends(get_db)) -> FormResponse:
    repo = ReservationsRepo(db)

    try:
        validate_working_hours(reservation.reservation_date)
    except ValueError as e:
        logger.warning("validation_failed_working_hours", error=str(e))
        reservations_rejected_total.labels(reason="validation").inc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    existing = repo.get_by_phone_number_and_date(
        reservation.phone_number,
        reservation.reservation_date,
        reservation.restaurant_name,
    )
    if existing:
        reservations_rejected_total.labels(reason="duplicate").inc()
        logger.warning(
            "reservation_already_exists",
            name=reservation.name,
            phone=reservation.phone_number,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="На это время уже есть бронь с таким номером телефона",
        )

    try:
        reservation_db = repo.create(reservation)
        reservations_created_total.labels(restaurant=reservation.restaurant_name).inc()
        reservation_guests.observe(reservation.number_of_guests)
        logger.info("reservation_created", reservation_id=reservation_db.id)
        return FormResponse.model_validate(reservation_db)
    except CreateReservationException as e:
        reservations_rejected_total.labels(reason="create_failed").inc()
        logger.error("create_reservation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get(
    path="/health",
    summary="Проверка работоспособности (приложение и БД)",
)
def health(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error("health_check_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="База данных недоступна",
        )
    return {"status": "ok"}
