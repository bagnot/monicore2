from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True)
    role = Column(String)
    password = Column(String)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    concerns = relationship("Concern", back_populates="resident")

class Tower(Base):
    __tablename__ = "towers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    floors = Column(Integer)
    units = Column(Integer)
    status = Column(String)
    tower_units = relationship("Unit", back_populates="tower")

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    unit_number = Column(String, nullable=False)
    floor = Column(Integer, nullable=False)
    status = Column(String, default="available")
    tower_id = Column(Integer, ForeignKey("towers.id"))
    tower = relationship("Tower", back_populates="tower_units")
    residents = relationship("User", backref="unit")

class Concern(Base):
    __tablename__ = "concerns"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="pending")
    remarks = Column(Text, nullable=True, default="")
    photo_url = Column(String, nullable=True)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"))
    resident = relationship("User", back_populates="concerns")

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))