import enum
from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class CardType(enum.Enum):
    visa = "visa"
    mastercard = "mastercard"

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    cardholder_name = Column(String, nullable=False)
    card_number = Column(String, unique=True, nullable=False)
    expiration_date = Column(Date, nullable=False)
    card_type = Column(Enum(CardType), nullable=False)
    row = Column(Integer, nullable=False)
    col = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False, default=0)
    drawer_id = Column(Integer, ForeignKey("drawers.id"), nullable=False)

    drawer = relationship("Drawer", back_populates="cards")
