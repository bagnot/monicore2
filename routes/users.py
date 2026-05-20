from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas import UserCreate, LoginRequest
from crud import create_user, get_users
from models import User
from auth import verify_password, create_access_token, hash_password, verify_token
from pydantic import BaseModel
from models import User, Tower, Unit

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/users")
def add_user(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "User not found"}
    if not verify_password(data.password, user.password):
        return {"message": "Incorrect password"}
    token = create_access_token({"user_id": user.id})
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    all_users = db.query(User).all()
    result = []
    for u in all_users:
        unit_info = None
        tower_info = None
        if u.unit:
            unit_info = {
                "id": u.unit.id,
                "unit_number": u.unit.unit_number,
                "floor": u.unit.floor
            }
            if u.unit.tower:
                tower_info = {
                    "id": u.unit.tower.id,
                    "name": u.unit.tower.name
                }
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "unit_id": u.unit_id,
            "unit": unit_info,
            "tower": tower_info,
            "is_active": u.is_active if u.is_active is not None else True,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return result

@router.put("/users/{user_id}/reset-password")
def reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_token)
):
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password = hash_password("Newtown@123")
    db.commit()
    return {"message": "Password reset successfully"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_token)
):
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.put("/users/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not verify_password(data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/users/forgot-password")
def forgot_password(
    data: dict,
    db: Session = Depends(get_db)
):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email")
    
    user.password = hash_password("Newtown@123")
    db.commit()
    return {"message": "Password reset successfully"}

@router.get("/users/me")
def get_me(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    u = db.query(User).filter(User.id == user_id).first()
    unit_info = None
    tower_info = None
    if u.unit:
        unit_info = {
            "id": u.unit.id,
            "unit_number": u.unit.unit_number,
            "floor": u.unit.floor
        }
        if u.unit.tower:
            tower_info = {
                "id": u.unit.tower.id,
                "name": u.unit.tower.name
            }
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "unit_id": u.unit_id,
        "unit": unit_info,
        "tower": tower_info
    }
    
@router.post("/users/resident")
def add_resident(
    data: dict,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_token)
):
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check email
    existing = db.query(User).filter(User.email == data["email"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Find or create tower
    tower = db.query(Tower).filter(Tower.name == data["cluster"]).first()
    if not tower:
        tower = Tower(name=data["cluster"], floors=20, units=50, status="active")
        db.add(tower)
        db.commit()
        db.refresh(tower)

    # Find or create unit
    unit = db.query(Unit).filter(
        Unit.tower_id == tower.id,
        Unit.floor == int(data["floor"]),
        Unit.unit_number == data["unit"].upper()
    ).first()
    if not unit:
        unit = Unit(
            tower_id=tower.id,
            floor=int(data["floor"]),
            unit_number=data["unit"].upper(),
            status="occupied"
        )
        db.add(unit)
        db.commit()
        db.refresh(unit)

    # Create user
    from auth import hash_password
    hashed_pw = hash_password(data["password"])
    new_user = User(
        name=data["name"],
        email=data["email"],
        role="resident",
        password=hashed_pw,
        unit_id=unit.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "message": "Resident created successfully"}

@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_token)
):
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    return {"message": "Status updated", "is_active": user.is_active}

@router.get("/setup")
def setup(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == "super@newtown.com").first()
    if existing:
        return {"message": "Already exists"}
    
    new_user = User(
        name="Super Admin",
        email="super@newtown.com",
        password=hash_password("Newtown@123"),
        role="superadmin",
        unit_id=None
    )
    db.add(new_user)
    db.commit()
    return {"message": "Superadmin created successfully"}