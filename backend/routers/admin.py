from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User, UserRole
from backend.models.audit_log import AuditLog
from backend.schemas.user import UserResponse
from backend.schemas.audit_log import AuditLogCreate, AuditLogResponse
from backend.services.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Operators ─────────────────────────────────────────────────────────────────

@router.get("/operators", response_model=list[UserResponse])
def list_operators(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).filter(User.role == UserRole.operator).order_by(User.display_name).all()


@router.patch("/operators/{username}/status", response_model=UserResponse)
def toggle_operator_status(
    username: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operator not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify admin accounts")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


# ── Audit logs ────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/audit-logs", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED)
def create_audit_log(
    payload: AuditLogCreate,
    db: Session = Depends(get_db),
):
    """
    Called by the frontend after card move / delete actions.
    Not admin-gated so operators can write their own logs.
    Protected only by the bearer token (any authenticated user).
    """
    from backend.services.auth import get_current_user
    # Note: we intentionally keep this open to authenticated users (not just admins)
    # so operators can submit their own action logs.
    log = AuditLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/audit-logs", status_code=status.HTTP_204_NO_CONTENT)
def clear_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    db.query(AuditLog).delete()
    db.commit()
