import enum
from sqlalchemy import Column, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship
from backend.database import Base


class CarnetSize(str, enum.Enum):
    twenty_five = "25"
    fifty = "50"


class Check(Base):
    __tablename__ = "checks"

    id = Column(Integer, primary_key=True, index=True)
    check_number = Column(String, nullable=False)
    montant = Column(Numeric(12, 2), nullable=False)
    carnet_size = Column(
        Enum(
            CarnetSize,
            name="carnet_size",
            values_callable=lambda values: [item.value for item in values],
        ),
        nullable=False,
    )
    client_name = Column(String, nullable=False)
    row = Column(Integer, nullable=False)
    col = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False, default=0)
    drawer_id = Column(Integer, ForeignKey("drawers.id", ondelete="CASCADE"), nullable=False)

    drawer = relationship("Drawer", back_populates="checks")
