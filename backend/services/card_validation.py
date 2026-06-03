from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models.drawer import Drawer


def get_drawer_or_404(db: Session, drawer_id: int) -> Drawer:
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(status_code=404, detail="Drawer not found")
    return drawer


def validate_card_position(drawer: Drawer, row: int, col: int) -> None:
    if row < 1 or row > drawer.rows:
        raise HTTPException(
            status_code=400,
            detail=f"row must be between 1 and {drawer.rows}",
        )

    if col < 1 or col > drawer.cols:
        raise HTTPException(
            status_code=400,
            detail=f"col must be between 1 and {drawer.cols}",
        )
