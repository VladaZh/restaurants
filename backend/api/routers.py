from typing import Optional

from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from db.exceptions import CreateReservationException
from db.reservations_repo import ReservationsRepo
from db.session import get_db
from api.models import FormRequest, FormResponse

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
        return Response(status_code=status.HTTP_400_BAD_REQUEST)

    existing = repo.get_by_phone_number_and_date(
        reservation.phone_number, reservation.reservation_date
    )
    if existing:
        return Response(status_code=status.HTTP_409_CONFLICT)

    try:
        reservation_db = repo.create(reservation)
        return FormResponse.model_validate(reservation_db)
    except CreateReservationException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
