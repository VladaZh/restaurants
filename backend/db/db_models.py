from datetime import datetime

from sqlalchemy import String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship


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
    restaurant_name: Mapped[str] = mapped_column(String(255), nullable=False)

    table_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("table_entity.id"), nullable=False
    )

    table = relationship("TableEntity", back_populates="reservations")


class TableEntity(Base):
    __tablename__ = "table_entity"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    number_of_guests: Mapped[int] = mapped_column(Integer(), default=2)
    restaurant_name: Mapped[str] = mapped_column(String(), nullable=False)

    reservations = relationship("Reservation", back_populates="table")
