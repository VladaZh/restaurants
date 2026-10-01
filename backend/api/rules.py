from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from db.db_models import Reservation, TableEntity
from logger import logger


def find_best_available_table(
    session: Session,
    checking_datetime: datetime,
    duration_minutes: int,
    number_of_guests: int,
    exclude_reservation_id: Optional[int] = None,
) -> Optional[int]:

    if number_of_guests <= 0:
        logger.warning("number_of_guests <= 0")
        raise ValueError("Количество гостей должно быть больше 0")
    if duration_minutes <= 0:
        logger.warning("duration_minutes <= 0")
        raise ValueError("Длительность бронирования должно быть больше 0")
    if checking_datetime.tzinfo is None:
        logger.warning("checking_datetime.tzinfo is None")
        checking_datetime = checking_datetime.replace(tzinfo=timezone.utc)
    if checking_datetime < datetime.now(timezone.utc):
        logger.warning("checking_datetime < datetime.now(timezone.utc)")
        raise ValueError("Нельзя бронировать на прошедшее время")

    suitable_tables = session.scalars(
        select(TableEntity)
        .where(
            TableEntity.number_of_guests >= number_of_guests,
            TableEntity.number_of_guests < number_of_guests * 2,
        )
        .order_by(TableEntity.number_of_guests.asc())
    ).all()

    if not suitable_tables:
        logger.warning("suitable_tables is None")
        return None

    checking_end = checking_datetime + timedelta(minutes=duration_minutes)
    checking_date = checking_datetime.date()

    suitable_table_ids = [table.id for table in suitable_tables]

    day_reservations = session.scalars(
        select(Reservation).where(
            func.date(Reservation.reservation_date) == checking_date,
            Reservation.table_id.in_(suitable_table_ids),
        )
    ).all()

    reservations_by_table: dict[int, list[Reservation]] = {}
    for res in day_reservations:
        if exclude_reservation_id is not None and res.id == exclude_reservation_id:
            continue
        if res.table_id not in reservations_by_table:
            reservations_by_table[res.table_id] = []
        reservations_by_table[res.table_id].append(res)

    for table in suitable_tables:
        table_reservations = reservations_by_table.get(table.id, [])

        if is_table_available(table_reservations, checking_datetime, checking_end):
            logger.debug("is_table_available", table_id=table.id)
            return table.id
    logger.debug("available table is not found", number_of_guests=number_of_guests, date=checking_date)
    return None


def is_table_available(
    reservations: list[Reservation], checking_datetime: datetime, checking_end: datetime
) -> bool:

    for res in reservations:
        res_end = res.reservation_date + timedelta(
            minutes=res.reservation_time_minutes + res.time_to_clean_up_minutes
        )

        if res.reservation_date < checking_end and res_end > checking_datetime:
            return False

    return True
