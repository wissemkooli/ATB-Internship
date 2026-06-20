from enum import Enum
from pydantic import BaseModel


class CarnetSize(str, Enum):
    twenty_five = "25"
    fifty = "50"


class CheckCreate(BaseModel):
    check_number: str
    montant: float
    carnet_size: CarnetSize
    client_name: str
    row: int
    col: int
    order: int
    drawer_id: int


class CheckMove(BaseModel):
    row: int
    col: int
    order: int
    drawer_id: int


class CheckResponse(BaseModel):
    id: int
    check_number: str
    montant: float
    carnet_size: str
    client_name: str
    row: int
    col: int
    order: int
    drawer_id: int

    class Config:
        from_attributes = True
