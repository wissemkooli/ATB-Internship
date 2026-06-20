from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.card import Card
from backend.models.user import User
from backend.services.auth import get_current_user_optional
from backend.services.card_validation import get_drawer_or_404, validate_card_position, validate_drawer_type
from backend.services.email_service import send_card_added_notification
from backend.schemas.card import CardCreate, CardMove, CardResponse

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.post("/", response_model=CardResponse)
def add_card(
    card: CardCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    drawer = get_drawer_or_404(db, card.drawer_id)
    validate_drawer_type(drawer, "cards")
    validate_card_position(drawer, card.row, card.col)

    db_card = Card(**card.model_dump())
    db.add(db_card)
    try:
        db.commit()
        db.refresh(db_card)
        background_tasks.add_task(
            send_card_added_notification,
            card_data=db_card.__dict__.copy(),
            operator_username=current_user.username if current_user else "unknown",
            drawer_name=drawer.name,
        )
        return db_card
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Card number already exists")

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

    drawer = get_drawer_or_404(db, move.drawer_id)
    validate_card_position(drawer, move.row, move.col)

    card.row = move.row
    card.col = move.col
    card.order = move.order
    card.drawer_id = move.drawer_id
    try:
        db.commit()
        db.refresh(card)
        return card
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Unable to move card")

@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}
