from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.card import Card
from backend.services.esp32 import highlight_card

router = APIRouter(prefix="/hardware", tags=["Hardware"])

class CompartmentHighlight(BaseModel):
    row: int
    col: int

@router.post("/highlight/compartment")
async def highlight_compartment_endpoint(compartment: CompartmentHighlight):
    await highlight_card(compartment.row, compartment.col)
    
    return {"message": f"Compartment ({compartment.row}, {compartment.col}) highlighted successfully"}

@router.post("/highlight/{card_id}")
async def highlight_card_endpoint(card_id: int, db: Session = Depends(get_db)):

    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    await highlight_card(card.row, card.col)
    
    return {"message": "Card highlighted successfully"}
