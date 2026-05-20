from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
        print("Added is_active")
    except Exception as e:
        print(f"is_active skipped: {e}")
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP"))
        print("Added created_at")
    except Exception as e:
        print(f"created_at skipped: {e}")
    conn.commit()

print("Migration done")
