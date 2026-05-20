from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Concern, User, Unit, Tower
from auth import verify_token
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_priority(title, description):
    text = f"{title} {description}".lower()
    high_keywords = ['leak', 'flood', 'fire', 'electric', 'short circuit', 'gas',
                     'emergency', 'urgent', 'danger', 'hazard', 'injury', 'burst', 'collapse']
    medium_keywords = ['noise', 'flickering', 'elevator', 'cctv', 'security', 'pest',
                       'overflowing', 'damage', 'not working', 'broken', 'offline']
    for word in high_keywords:
        if word in text:
            return 'high'
    for word in medium_keywords:
        if word in text:
            return 'medium'
    return 'low'

def format_concern(concern, db, include_priority=False):
    user = db.query(User).filter(User.id == concern.user_id).first()
    unit_info = None
    tower_info = None
    if user and user.unit_id:
        unit = db.query(Unit).filter(Unit.id == user.unit_id).first()
        if unit:
            unit_info = {
                "id": unit.id,
                "unit_number": unit.unit_number,
                "floor": unit.floor
            }
            tower = db.query(Tower).filter(Tower.id == unit.tower_id).first()
            if tower:
                tower_info = {
                    "id": tower.id,
                    "name": tower.name
                }
    result = {
        "id": concern.id,
        "title": concern.title,
        "description": concern.description,
        "status": concern.status,
        "photo_url": concern.photo_url,
        "submitted_at": concern.submitted_at,
        "user_id": concern.user_id,
        "resident_name": user.name if user else "Unknown",
        "unit": unit_info,
        "tower": tower_info
    }
    if include_priority:
        result["priority"] = get_priority(concern.title, concern.description)
    return result

@router.post("/concerns")
def submit_concern(
    title: str = Form(...),
    description: str = Form(...),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    photo_url = None
    if photo and photo.filename:
        try:
            result = cloudinary.uploader.upload(
                photo.file,
                folder="monicore/concerns",
                resource_type="image"
            )
            photo_url = result["secure_url"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    concern = Concern(
        title=title,
        description=description,
        photo_url=photo_url,
        user_id=user_id
    )
    db.add(concern)
    db.commit()
    db.refresh(concern)
    return format_concern(concern, db, include_priority=False)

@router.get("/concerns/my")
def my_concerns(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    concerns = db.query(Concern).filter(Concern.user_id == user_id).all()
    return [format_concern(c, db, include_priority=False) for c in concerns]

@router.get("/concerns/{concern_id}")
def get_concern(
    concern_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    concern = db.query(Concern).filter(Concern.id == concern_id).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern not found")
    user = db.query(User).filter(User.id == user_id).first()
    is_admin = user.role in ["admin", "superadmin"]
    if user.role == "resident" and concern.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return format_concern(concern, db, include_priority=is_admin)

@router.get("/concerns")
def all_concerns(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    concerns = db.query(Concern).all()
    return [format_concern(c, db, include_priority=True) for c in concerns]

@router.put("/concerns/{concern_id}")
def update_concern(
    concern_id: int,
    status: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    concern = db.query(Concern).filter(Concern.id == concern_id).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern not found")
    concern.status = status
    db.commit()
    db.refresh(concern)
    return format_concern(concern, db, include_priority=True)

@router.delete("/concerns/{concern_id}")
def delete_concern(
    concern_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    concern = db.query(Concern).filter(Concern.id == concern_id).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern not found")
    db.delete(concern)
    db.commit()
    return {"message": "Concern deleted successfully"}


@router.delete("/concerns/resolved/all")
def delete_resolved_concerns(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    resolved = db.query(Concern).filter(Concern.status == "resolved").all()
    count = len(resolved)
    for concern in resolved:
        db.delete(concern)
    db.commit()
    return {"message": f"{count} resolved concern(s) deleted"}
