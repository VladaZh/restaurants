from logging.config import fileConfig
import os
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

from db import db_models

project_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(project_root / '.env')

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


database_url = os.getenv("DB_URL")

if not database_url:
    raise RuntimeError("Переменная окружения DB_URL не установлена")


target_metadata = db_models.Base.metadata


def run_migrations_offline() -> None:
    """Запуск миграций в offline-режиме."""
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Запуск миграций в online-режиме."""
    configuration = config.get_section(config.config_ini_section)

    configuration["sqlalchemy.url"] = database_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
