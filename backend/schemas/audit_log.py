from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class AuditActionType(str, Enum):
    move = "move"
    delete = "delete"
    search = "search"
    login = "login"
    logout = "logout"
    create = "create"


class AuditLogCreate(BaseModel):
    operator_username: str
    action_type: AuditActionType
    description: str


class AuditLogResponse(BaseModel):
    id: int
    operator_username: str
    action_type: AuditActionType
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}
