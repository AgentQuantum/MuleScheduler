"""
Database configuration module.
This separates db initialization from app.py to avoid circular imports.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
