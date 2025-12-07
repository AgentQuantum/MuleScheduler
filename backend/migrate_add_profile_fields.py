"""Migration script to add profile fields to users table"""

from sqlalchemy import text

from app import app, db

with app.app_context():
    conn = db.engine.connect()
    trans = conn.begin()

    try:
        # Add profile_picture_url column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500)"))
            print("Added profile_picture_url column")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("profile_picture_url column already exists")
            else:
                print(f"Error adding profile_picture_url: {e}")

        # Add bio column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT"))
            print("Added bio column")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("bio column already exists")
            else:
                print(f"Error adding bio: {e}")

        # Add class_year column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN class_year INTEGER"))
            print("Added class_year column")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("class_year column already exists")
            else:
                print(f"Error adding class_year: {e}")

        trans.commit()
        print("Migration complete!")
    except Exception as e:
        trans.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()


