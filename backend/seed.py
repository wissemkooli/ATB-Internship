"""
Seed script — inserts the 4 initial users with bcrypt-hashed passwords.
Safe to re-run: uses INSERT … ON CONFLICT DO NOTHING via merge logic.

Run from project root:
    python -m backend.seed
"""

from backend.database import SessionLocal
from backend.models.user import User, UserRole
from backend.services.auth import hash_password

SEED_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "display_name": "Admin",
        "role": UserRole.admin,
        "is_active": True,
    },
    {
        "username": "ahmed",
        "password": "op1234",
        "display_name": "Ahmed",
        "role": UserRole.operator,
        "is_active": True,
    },
    {
        "username": "sana",
        "password": "op5678",
        "display_name": "Sana",
        "role": UserRole.operator,
        "is_active": True,
    },
    {
        "username": "karim",
        "password": "op9999",
        "display_name": "Karim",
        "role": UserRole.operator,
        "is_active": True,
    },
]


def seed():
    db = SessionLocal()
    try:
        inserted = 0
        for entry in SEED_USERS:
            exists = db.query(User).filter(User.username == entry["username"]).first()
            if exists:
                print(f"  skip  {entry['username']} (already exists)")
                continue

            user = User(
                username=entry["username"],
                hashed_password=hash_password(entry["password"]),
                display_name=entry["display_name"],
                role=entry["role"],
                is_active=entry["is_active"],
            )
            db.add(user)
            inserted += 1
            print(f"  add   {entry['username']} ({entry['role'].value})")

        db.commit()
        print(f"\nDone — {inserted} user(s) inserted.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
