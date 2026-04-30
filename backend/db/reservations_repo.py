from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from db.db_models import Reservation
from models import FormRequest


class ReservationsRepo:
    def __init__(self, session: Session):
        self.session = session

    def _model_to_read(self, model: Reservation) -> FormRequest:
        return FormRequest.model_validate(model)

    def _get_by_query(self, **filters) -> Optional[FormRequest]:
        stmt = select(Reservation)
        for field, value in filters.items():
            stmt = stmt.where(getattr(Reservation, field) == value)

        result = self.session.execute(stmt)
        instance = result.scalar_one_or_none()

        if instance is None:
            return None

        return FormRequest.model_validate(instance)

    def create(self, data: FormRequest) -> Optional[FormRequest]:
        new_form = Reservation(**data.model_dump())
        self.session.add(new_form)
        self.session.commit()
        self.session.refresh(new_form)
        return new_form

    def get_by_id(self, id: int) -> Optional[FormRequest]:
        return self._get_by_query(id=id)

    def get_by_phone_number_and_date(
        self, phone_number: str, reservation_date: datetime
    ) -> Optional[FormRequest]:
        return self._get_by_query(
            phone_number=phone_number, reservation_date=reservation_date
        )

    def get_all(self) -> list[FormRequest]:
        stmt = select(Reservation)
        results = self.session.execute(stmt).scalars().all()
        return [FormRequest.model_validate(reservation) for reservation in results]

    def update(self, id: int, data: FormRequest) -> Optional[FormRequest]:
        stmt = select(Reservation).where(Reservation.id == id)
        result = self.session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing is None:
            return None

        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            setattr(existing, field, value)

        self.session.commit()
        self.session.refresh(existing)

        return self._model_to_read(existing)

    def delete(self, id: int) -> bool:
        stmt = select(Reservation).where(Reservation.id == id)
        result = self.session.execute(stmt)
        reservation = result.scalar_one_or_none()

        if reservation is None:
            return False

        self.session.delete(reservation)
        self.session.commit()
        return True
