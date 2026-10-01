"""initial migration

Revision ID: 295c2a61604f
Revises:
Create Date: 2026-10-01 17:53:43.437419

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "295c2a61604f"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "table_entity",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("number_of_guests", sa.Integer(), nullable=False),
        sa.Column("restaurant_name", sa.String(length=255), nullable=False),
    )

    op.create_table(
        "reservations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone_number", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("reservation_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "reservation_time_minutes",
            sa.Integer(),
            nullable=False,
            server_default="90",
        ),
        sa.Column(
            "time_to_clean_up_minutes", sa.Integer(), nullable=False, server_default="5"
        ),
        sa.Column("number_of_guests", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("restaurant_name", sa.String(length=255), nullable=False),
        sa.Column(
            "table_id", sa.Integer(), sa.ForeignKey("table_entity.id"), nullable=False
        ),
    )

    table_entity = sa.table(
        "table_entity",
        sa.column("number_of_guests", sa.Integer),
        sa.column("restaurant_name", sa.String),
    )

    op.bulk_insert(
        table_entity,
        [
            *({"number_of_guests": 2, "restaurant_name": "Firenze"} for _ in range(5)),
            *({"number_of_guests": 4, "restaurant_name": "Firenze"} for _ in range(4)),
            *({"number_of_guests": 6, "restaurant_name": "Firenze"} for _ in range(2)),
            *({"number_of_guests": 2, "restaurant_name": "Roma"} for _ in range(5)),
            *({"number_of_guests": 4, "restaurant_name": "Roma"} for _ in range(4)),
            *({"number_of_guests": 6, "restaurant_name": "Roma"} for _ in range(2)),
            {"number_of_guests": 8, "restaurant_name": "Firenze"},
            {"number_of_guests": 8, "restaurant_name": "Roma"},
            {"number_of_guests": 10, "restaurant_name": "Firenze"},
            {"number_of_guests": 10, "restaurant_name": "Roma"},
        ],
    )


def downgrade() -> None:
    op.drop_table("reservations")
    op.drop_table("table_entity")
