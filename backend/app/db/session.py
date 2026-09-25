from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

def get_database_url() -> str:
    url = settings.get_database_uri()
    # Render and other cloud providers often provide 'postgres://' which SQLAlchemy requires as 'postgresql://'
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

db_url = get_database_url()

# Configure engine arguments based on dialect
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False,
        future=True,
    )
else:
    try:
        # PostgreSQL / production cloud DB settings
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            pool_recycle=300,
            echo=False,
            future=True,
        )
    except Exception as e:
        print(f"PostgreSQL initialization notice: {e}, falling back to local SQLite.")
        engine = create_engine(
            "sqlite:///./deepshield.db",
            connect_args={"check_same_thread": False},
            echo=False,
            future=True,
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def ensure_database_schema_compat():
    """Ensures SQLite/Postgres tables have all new columns without failing existing tables."""
    try:
        with engine.begin() as conn:
            if engine.dialect.name == "sqlite":
                res = conn.exec_driver_sql("PRAGMA table_info(challenge_sessions)").fetchall()
                existing_cols = {row[1] for row in res}
                cols_to_add = [
                    ("event_id", "VARCHAR(64)"),
                    ("source", "VARCHAR(64) DEFAULT 'Dynamic Challenge Studio'"),
                    ("person_identity", "VARCHAR(128) DEFAULT 'Target Identity'"),
                    ("detection_type", "VARCHAR(64) DEFAULT 'Vocal Liveness Challenge'"),
                    ("risk_level", "VARCHAR(20) DEFAULT 'low'"),
                    ("confidence_score", "FLOAT DEFAULT 0.0"),
                    ("verification_status", "VARCHAR(30) DEFAULT 'pending'"),
                    ("challenge_response", "TEXT"),
                    ("challenge_result", "VARCHAR(30)"),
                    ("evidence_id", "VARCHAR(128)"),
                    ("final_decision", "VARCHAR(40) DEFAULT 'PENDING_VERIFICATION'"),
                    ("details", "TEXT"),
                ]
                for col_name, col_type in cols_to_add:
                    if col_name not in existing_cols:
                        try:
                            conn.exec_driver_sql(f"ALTER TABLE challenge_sessions ADD COLUMN {col_name} {col_type}")
                        except Exception:
                            pass
    except Exception as e:
        print(f"Schema compatibility check notice: {e}")


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
