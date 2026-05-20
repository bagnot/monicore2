from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Announcement, User
from auth import verify_token
from datetime import datetime, timezone

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/announcements")
def get_announcements(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    announcements = db.query(Announcement).filter(Announcement.is_active == True).order_by(Announcement.created_at.desc()).all()
    result = []
    for a in announcements:
        author = db.query(User).filter(User.id == a.posted_by).first()
        result.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "posted_by": author.name if author else "Unknown",
            "created_at": a.created_at,
            "is_active": a.is_active
        })
    return result

@router.post("/announcements")
def create_announcement(
    title: str,
    content: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    announcement = Announcement(title=title, content=content, posted_by=user_id)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return {"id": announcement.id, "message": "Announcement posted"}

@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    announcement.is_active = False
    db.commit()
    return {"message": "Announcement deleted"}