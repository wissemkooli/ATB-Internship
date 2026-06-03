from pydantic import BaseModel
from datetime import date
from enum import Enum

class CardType(str, Enum):
    visa = "visa"
    mastercard = "mastercard"

class CardCreate(BaseModel):
    cardholder_name: str
    card_number: str
    expiration_date: date
    card_type: CardType
    row: int
    col: int
    order: int
    drawer_id: int

class CardMove(BaseModel):
    row: int
    col: int
    order: int
    drawer_id: int

class CardResponse(BaseModel):
    id: int
    cardholder_name: str
    card_number: str
    expiration_date: date
    card_type: CardType
    row: int
    col: int
    order: int
    drawer_id: int

    class Config:
        from_attributes = True