from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.card import Card
from backend.schemas.card import CardCreate, CardMove, CardResponse

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.post("/", response_model=CardResponse)
def add_card(card: CardCreate, db: Session = Depends(get_db)):
    db_card = Card(**card.model_dump())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@router.get("/search", response_model=list[CardResponse])
def search_cards(q: str, db: Session = Depends(get_db)):
    return db.query(Card).filter(
        Card.cardholder_name.ilike(f"%{q}%") |
        Card.card_number.ilike(f"%{q}%")
    ).all()

@router.get("/{card_id}", response_model=CardResponse)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@router.patch("/{card_id}/move", response_model=CardResponse)
def move_card(card_id: int, move: CardMove, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.row = move.row
    card.col = move.col
    card.order = move.order
    card.drawer_id = move.drawer_id
    db.commit()
    db.refresh(card)
    return card

@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}