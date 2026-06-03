from pydantic import BaseModel

class DrawerCreate(BaseModel):
    name: str
    rows: int
    cols: int

class DrawerResponse(BaseModel):
    id: int
    name: str
    rows: int
    cols: int

    class Config:
        from_attributes = True