from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import models
import os
from routes import users, towers, units, dashboard, concerns, announcements
from sqlalchemy import text

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Add missing columns if they don't exist
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE concerns ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT ''"))
    conn.execute(text("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE"))
    conn.commit()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(users.router)
app.include_router(towers.router)
app.include_router(units.router)
app.include_router(dashboard.router)
app.include_router(concerns.router)
app.include_router(announcements.router)

@app.get("/")
def home():
    return {"message": "MONICORE API running"}

@app.get("/setup")
def setup():
    from database import SessionLocal
    from models import User
    from auth import hash_password
    db = SessionLocal()
    existing = db.query(User).filter(User.email == "super@newtown.com").first()
    if existing:
        return {"message": "Already exists"}
    u = User(
        name="Super Admin",
        email="super@newtown.com",
        password=hash_password("Newtown@123"),
        role="superadmin",
        unit_id=None
    )
    db.add(u)
    db.commit()
    return {"message": "Done!"}
