import enum
from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship
from backend.database import Base

class DrawerType(str, enum.Enum):
    cards = "cards"
    checks = "checks"

class Drawer(Base):
    __tablename__ = "drawers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    drawer_type = Column(Enum(DrawerType, name="drawer_type"), nullable=False, default=DrawerType.cards)

    cards = relationship("Card", back_populates="drawer")
    checks = relationship("Check", back_populates="drawer", cascade="all, delete-orphan")
