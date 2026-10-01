from typing import Optional

from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

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
def send_form(
    reservation: FormRequest, db: Session = Depends(get_db)
) -> Response | Optional[FormResponse]:
    repo = ReservationsRepo(db)

    if reservation is None:
        logger.info("reservation is None", resourse="send-form", status_code=status.HTTP_400_BAD_REQUEST)
        return Response(status_code=status.HTTP_400_BAD_REQUEST)

    existing = repo.get_by_phone_number_and_date(
        reservation.phone_number, reservation.reservation_date
    )
    if existing:
        logger.info("reservation already exists", reservation_name=reservation.name, revervation_phone_number=reservation.revervation_phone_number )
        return Response(status_code=status.HTTP_409_CONFLICT)

    try:
        reservation_db = repo.create(reservation)
        logger.info("reservation created", reservation_id=reservation_db.id)
        return FormResponse.model_validate(reservation_db)
    except CreateReservationException as e:
        logger.error("reservation already exists", e=e, status_code=status.HTTP_409_CONFLICT)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
