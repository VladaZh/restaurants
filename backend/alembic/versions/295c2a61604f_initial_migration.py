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
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("number_of_guests", sa.Integer(), nullable=False),
    )

    table_entity = sa.table(
        "table_entity",
        sa.column("number_of_guests", sa.Integer),
    )

    op.bulk_insert(
        table_entity,
        [
            *({"number_of_guests": 2} for _ in range(10)),
            *({"number_of_guests": 4} for _ in range(8)),
            *({"number_of_guests": 6} for _ in range(3)),
            {"number_of_guests": 8},
            {"number_of_guests": 10},
        ],
    )


def downgrade() -> None:
    op.drop_table("table_entity")
