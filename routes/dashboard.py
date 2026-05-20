from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Tower, Unit, User
from auth import verify_token  # ← add this

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)  # ← add this
):
    towers = db.query(Tower).all()
    result = []
    for tower in towers:
        units_data = []
        units = db.query(Unit).filter(Unit.tower_id == tower.id).all()
        for unit in units:
            users = db.query(User).filter(User.unit_id == unit.id).all()
            units_data.append({
                "id": unit.id,
                "unit_number": unit.unit_number,
                "floor": unit.floor,
                "status": unit.status,
                "users": [
                    {"id": u.id, "name": u.name, "email": u.email, "role": u.role}
                    for u in users
                ]
            })
        result.append({
            "id": tower.id,
            "name": tower.name,
            "floors": tower.floors,
            "status": tower.status,
            "units": units_data
        })
    return result