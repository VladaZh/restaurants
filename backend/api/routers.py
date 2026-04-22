from fastapi import APIRouter, status
from fastapi.responses import Response

from models import FormRequest

router = APIRouter()


@router.post(path="/send-form/", summary="Отправить форму")
async def send_form(request: FormRequest) -> Response:
    return Response(status_code=status.HTTP_200_OK)
