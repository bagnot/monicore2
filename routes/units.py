from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas import UnitCreate
from crud import create_unit, get_units
from auth import verify_token
from models import User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/units")
def add_unit(
    unit: UnitCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return create_unit(db, unit)

@router.get("/units")
def list_units(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return get_units(db)