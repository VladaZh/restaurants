from datetime import datetime

from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase


class Base(DeclarativeBase):
    pass


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reservation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reservation_time_minutes: Mapped[int] = mapped_column(Integer(), default=90)
    time_to_clean_up_minutes: Mapped[int] = mapped_column(Integer(), default=5)
    number_of_guests: Mapped[int] = mapped_column(Integer(), default=2)
    table_id: Mapped[int] = mapped_column(Integer())


class TableEntity(Base):
    __tablename__ = "table_entity"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    number_of_guests: Mapped[int] = mapped_column(Integer(), default=2)
