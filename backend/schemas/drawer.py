from pydantic import BaseModel
from enum import Enum

class DrawerType(str, Enum):
    cards = "cards"
    checks = "checks"

class DrawerCreate(BaseModel):
    name: str
    rows: int
    cols: int
    drawer_type: DrawerType = DrawerType.cards

class DrawerResponse(BaseModel):
    id: int
    name: str
    rows: int
    cols: int
    drawer_type: str

    class Config:
        from_attributes = True
