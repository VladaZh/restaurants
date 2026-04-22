from datetime import datetime

import phonenumbers
from pydantic import BaseModel, Field, EmailStr, field_validator


class FormRequest(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    phone_number: str = Field(min_length=6, max_length=20)
    email: EmailStr
    date: datetime
    number_of_guests: int = Field(ge=2, le=10)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        try:
            parsed = phonenumbers.parse(value, None)
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Phone number is incorrect")
        except phonenumbers.NumberParseException:
            ValueError("Phone number is not in international format")
        return value
