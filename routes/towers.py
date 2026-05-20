from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas import TowerCreate
from crud import create_tower, get_towers
from auth import verify_token
from models import User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/towers")
def add_tower(
    tower: TowerCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return create_tower(db, tower)

@router.get("/towers")
def list_towers(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return get_towers(db)

@router.delete("/towers/{tower_id}")
def delete_tower(
    tower_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    tower = db.query(Tower).filter(Tower.id == tower_id).first()
    if not tower:
        raise HTTPException(status_code=404, detail="Tower not found")
    db.delete(tower)
    db.commit()
    return {"message": "Tower deleted"}
