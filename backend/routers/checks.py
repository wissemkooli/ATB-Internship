from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.check import Check
from backend.models.user import User
from backend.services.auth import get_current_user_optional
from backend.services.card_validation import get_drawer_or_404, validate_card_position, validate_drawer_type
from backend.services.email_service import send_check_added_notification
from backend.schemas.check import CheckCreate, CheckMove, CheckResponse

router = APIRouter(prefix="/checks", tags=["Checks"])


@router.post("/", response_model=CheckResponse)
def add_check(
    check: CheckCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    drawer = get_drawer_or_404(db, check.drawer_id)
    validate_drawer_type(drawer, "checks")
    validate_card_position(drawer, check.row, check.col)

    db_check = Check(**check.model_dump())
    db.add(db_check)
    try:
        db.commit()
        db.refresh(db_check)
        background_tasks.add_task(
            send_check_added_notification,
            check_data=db_check.__dict__.copy(),
            operator_username=current_user.username if current_user else "unknown",
            drawer_name=drawer.name,
        )
        return db_check
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Unable to add check")


@router.get("/search", response_model=list[CheckResponse])
def search_checks(q: str, db: Session = Depends(get_db)):
    return db.query(Check).filter(
        Check.client_name.ilike(f"%{q}%") |
        Check.check_number.ilike(f"%{q}%")
    ).all()


@router.get("/{check_id}", response_model=CheckResponse)
def get_check(check_id: int, db: Session = Depends(get_db)):
    check = db.query(Check).filter(Check.id == check_id).first()
    if not check:
        raise HTTPException(status_code=404, detail="Check not found")
    return check


@router.patch("/{check_id}/move", response_model=CheckResponse)
def move_check(check_id: int, move: CheckMove, db: Session = Depends(get_db)):
    check = db.query(Check).filter(Check.id == check_id).first()
    if not check:
        raise HTTPException(status_code=404, detail="Check not found")

    drawer = get_drawer_or_404(db, move.drawer_id)
    validate_drawer_type(drawer, "checks")
    validate_card_position(drawer, move.row, move.col)

    check.row = move.row
    check.col = move.col
    check.order = move.order
    check.drawer_id = move.drawer_id
    try:
        db.commit()
        db.refresh(check)
        return check
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Unable to move check")


@router.delete("/{check_id}")
def delete_check(check_id: int, db: Session = Depends(get_db)):
    check = db.query(Check).filter(Check.id == check_id).first()
    if not check:
        raise HTTPException(status_code=404, detail="Check not found")
    db.delete(check)
    db.commit()
    return {"message": "Check deleted"}
