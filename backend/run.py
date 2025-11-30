"""
Alternative entry point for running the Flask app.
This can be useful for production deployments.
"""

from app import app, init_db

if __name__ == "__main__":
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000, host="0.0.0.0")
