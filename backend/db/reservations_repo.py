from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from db.db_models import Reservation

from db.exceptions import (
    CreateReservationException,
    UpdateReservationException,
    DeleteReservationException,
)
from api.models import FormRequest
from api.rules import find_best_available_table
from logger import logger


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

    def create(self, data: FormRequest) -> Reservation:
        table_id = find_best_available_table(
            session=self.session,
            checking_datetime=data.reservation_date,
            duration_minutes=data.reservation_time_minutes,
            number_of_guests=data.number_of_guests,
            restaurant_name=data.restaurant_name,
        )
        if table_id is None:
            logger.warning("table_id is None")
            raise CreateReservationException(
                "На это время нет свободных столиков. Выберите другое время."
            )
        new_form = Reservation(**data.model_dump())
        new_form.table_id = table_id
        self.session.add(new_form)
        self.session.commit()
        logger.info("created reservation", id=new_form.id)
        self.session.refresh(new_form)
        return new_form

    def get_by_id(self, id: int) -> Optional[FormRequest]:
        result = self._get_by_query(id=id)
        logger.info("got reservation by id", id=id, result_is_none=result is None)
        return result

    def get_by_phone_number_and_date(
        self, phone_number: str, reservation_date: datetime, restaurant_name: str
    ) -> Optional[FormRequest]:
        stmt = select(Reservation).where(
            Reservation.phone_number == phone_number,
            func.date(Reservation.reservation_date) == reservation_date.date(),
            Reservation.restaurant_name == restaurant_name,
        )
        result = self.session.execute(stmt)
        instance = result.scalar_one_or_none()

        logger.info(
            "got by phone_number",
            phone_number=phone_number,
            result_is_none=instance is None,
        )

        if instance is None:
            return None

        return FormRequest.model_validate(instance)

    def get_all(self) -> list[FormRequest]:
        stmt = select(Reservation)
        results = self.session.execute(stmt).scalars().all()
        logger.info("got all reservations", results_is_none=results is None)
        return [FormRequest.model_validate(reservation) for reservation in results]

    def update(self, id: int, data: FormRequest) -> Optional[FormRequest]:
        stmt = select(Reservation).where(Reservation.id == id)
        result = self.session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing is None:
            logger.warning("reservation does not exist", id=id)
            raise UpdateReservationException("Эта бронь не найдена")

        update_data = data.model_dump(exclude_unset=True, exclude_none=True)

        changed_fields = {
            "reservation_date",
            "reservation_time_minutes",
            "number_of_guests",
            "restaurant_name",
        }
        key_fields_changed = bool(changed_fields & set(update_data.keys()))

        if key_fields_changed:
            new_datetime = update_data.get(
                "reservation_date", existing.reservation_date
            )
            new_duration = update_data.get(
                "reservation_time_minutes", existing.reservation_time_minutes
            )
            new_guests = update_data.get("number_of_guests", existing.number_of_guests)
            new_restaurant = update_data.get(
                "restaurant_name", existing.restaurant_name
            )

            new_table_id = find_best_available_table(
                session=self.session,
                checking_datetime=new_datetime,
                duration_minutes=new_duration,
                number_of_guests=new_guests,
                restaurant_name=new_restaurant,
                exclude_reservation_id=existing.id,
            )

            logger.info("new_table_id", new_table_id=new_table_id)
            if new_table_id is None:
                logger.warning("new_table_id is None")
                raise UpdateReservationException(
                    "На это время нет свободных столиков. Выберите другое время."
                )

            update_data["table_id"] = new_table_id

        for field, value in update_data.items():
            setattr(existing, field, value)

        self.session.commit()
        logger.info("updated reservation", id=id, update_data=update_data)
        self.session.refresh(existing)

        return self._model_to_read(existing)

    def delete(self, id: int) -> bool:
        stmt = select(Reservation).where(Reservation.id == id)
        result = self.session.execute(stmt)
        reservation = result.scalar_one_or_none()

        if reservation is None:
            logger.warning("reservation does not exist", id=id)
            raise DeleteReservationException("Эта бронь не найдена")

        self.session.delete(reservation)
        logger.info("deleted reservation", id=id)
        self.session.commit()
        return True
