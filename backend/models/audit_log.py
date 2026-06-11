import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from backend.database import Base


class AuditActionType(enum.Enum):
    move = "move"
    delete = "delete"
    search = "search"
    login = "login"
    logout = "logout"
    create = "create"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    operator_username = Column(String, nullable=False, index=True)
    action_type = Column(Enum(AuditActionType), nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
