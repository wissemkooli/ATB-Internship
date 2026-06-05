from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.card import Card
from backend.services.esp32 import highlight_card

router = APIRouter(prefix="/hardware", tags=["Hardware"])

@router.post("/highlight/{card_id}")
async def highlight_card_endpoint(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    await highlight_card(card.row, card.col)
    
    return {"message": "Card highlighted successfully"}
