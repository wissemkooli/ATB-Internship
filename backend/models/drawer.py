from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.database import Base

class Drawer(Base):
    __tablename__ = "drawers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)

    cards = relationship("Card", back_populates="drawer")
