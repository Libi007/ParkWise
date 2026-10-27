import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")


class Config:
    """Base application configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "parkwise-dev-secret-key-3ac12f33")
    
    # Database
    db_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'instance' / 'parkwise.db'}")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Model Artifact
    _default_model_path = BASE_DIR / "artifacts" / "parkwise_lightgbm_model.pkl"
    MODEL_PATH = os.getenv("MODEL_PATH", str(_default_model_path))
    if not os.path.isabs(MODEL_PATH):
        MODEL_PATH = str(BASE_DIR / MODEL_PATH)
        
    MODEL_NAME = os.getenv("MODEL_NAME", "LightGBM-Regressor-Tuned")
    MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")
    
    # Timezone Handling (Dataset origin: The Hague/Scheveningen, Netherlands)
    PARKWISE_TIMEZONE = os.getenv("PARKWISE_TIMEZONE", "Europe/Amsterdam")
    
    # CORS
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    # In tests, model path can point to real or mock artifact
    MODEL_PATH = str(BASE_DIR / "artifacts" / "parkwise_lightgbm_model.pkl")


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
