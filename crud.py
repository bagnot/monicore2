from auth import hash_password
from models import User, Tower, Unit
from fastapi import HTTPException

def create_user(db, user):
    # Check if email already exists
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pw = hash_password(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        role=user.role,
        password=hashed_pw,
        unit_id=user.unit_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db):
    return db.query(User).all()


def create_tower(db, tower):
    db_tower = Tower(**tower.dict())
    db.add(db_tower)
    db.commit()
    db.refresh(db_tower)
    return db_tower

def get_towers(db):
    return db.query(Tower).all()


def create_unit(db, unit):
    db_unit = Unit(**unit.dict())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

def get_units(db):
    return db.query(Unit).all()