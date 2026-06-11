from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.drawer import Drawer
from backend.schemas.drawer import DrawerCreate, DrawerResponse
from backend.models.card import Card
from backend.schemas.card import CardResponse

router = APIRouter(prefix="/drawers", tags=["Drawers"])

@router.post("/", response_model=DrawerResponse)
def create_drawer(drawer: DrawerCreate, db: Session = Depends(get_db)):
    db_drawer = Drawer(**drawer.model_dump())
    db.add(db_drawer)
    db.commit()
    db.refresh(db_drawer)
    return db_drawer

@router.get("/", response_model=list[DrawerResponse])
def get_drawers(db: Session = Depends(get_db)):
    return db.query(Drawer).all()

@router.get("/{drawer_id}", response_model=DrawerResponse)
def get_drawer(drawer_id: int, db: Session = Depends(get_db)):
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(status_code=404, detail="Drawer not found")
    return drawer

@router.get("/{drawer_id}/cards", response_model=list[CardResponse])
def get_drawer_cards(drawer_id: int, db: Session = Depends(get_db)):
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(status_code=404, detail="Drawer not found")
    return db.query(Card).filter(Card.drawer_id == drawer_id).order_by(Card.row, Card.col, Card.order).all()


@router.delete("/{drawer_id}")
def delete_drawer(drawer_id: int, db: Session = Depends(get_db)):
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(status_code=404, detail="Drawer not found")
    
    # Delete all cards associated with this drawer
    db.query(Card).filter(Card.drawer_id == drawer_id).delete()
    
    db.delete(drawer)
    db.commit()
    return {"message": "Drawer and all its associated cards deleted successfully"}