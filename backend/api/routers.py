from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session

from api.rules import validate_working_hours
from db.exceptions import CreateReservationException
from db.reservations_repo import ReservationsRepo
from db.session import get_db
from api.models import FormRequest, FormResponse
from logger import logger

router = APIRouter()


@router.post(
    path="/send-form/",
    response_model=FormResponse,
    summary="Отправить форму",
    status_code=status.HTTP_201_CREATED,
)
def send_form(reservation: FormRequest, db: Session = Depends(get_db)) -> FormResponse:
    repo = ReservationsRepo(db)

    try:
        validate_working_hours(reservation.reservation_date)
    except ValueError as e:
        logger.warning("validation_failed_working_hours", error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    existing = repo.get_by_phone_number_and_date(
        reservation.phone_number,
        reservation.reservation_date,
        reservation.restaurant_name,
    )
    if existing:
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
        logger.info("reservation_created", reservation_id=reservation_db.id)
        return FormResponse.model_validate(reservation_db)
    except CreateReservationException as e:
        logger.error("create_reservation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
