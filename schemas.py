from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    password: str
    unit_id: int | None = None
    
from pydantic import BaseModel

class TowerCreate(BaseModel):
    name: str
    floors: int
    units: int
    status: str
    
class UnitCreate(BaseModel):
    unit_number: str
    floor: int
    status: str
    tower_id: int

class LoginRequest(BaseModel):
    email: str
    password: str
