import os
import logging
from flask import Flask
from app.config import config_by_name, Config
from app.extensions import db, migrate, cors
from app.routes.health import health_bp
from app.routes.facilities import facilities_bp
from app.routes.predictions import predictions_bp
from app.services.facility_service import seed_facilities_if_needed
from app.services.model_service import ModelService
from app.utils.responses import error_response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)
logger = logging.getLogger(__name__)


def create_app(config_name=None):
    """
    Application factory for ParkWise Flask Backend.
    """
    app = Flask(__name__, instance_relative_config=True)

    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    if isinstance(config_name, str):
        config_class = config_by_name.get(config_name, Config)
    else:
        config_class = config_name

    app.config.from_object(config_class)

    # Ensure instance directory exists
    os.makedirs(app.instance_path, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Configure CORS for configured origins
    cors_origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"])
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True,
        methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # Register blueprints under versioned prefix /api/v1
    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(facilities_bp, url_prefix="/api/v1")
    app.register_blueprint(predictions_bp, url_prefix="/api/v1")

    # Global HTTP error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return error_response(message="Bad Request: Please check your input parameters.", status_code=400)

    @app.errorhandler(404)
    def not_found(e):
        return error_response(message="Resource not found.", status_code=404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response(message="Method not allowed for this endpoint.", status_code=405)

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Internal Server Error")
        return error_response(message="An internal server error occurred.", status_code=500)

    # Load ML Model once during startup
    model_path = app.config.get("MODEL_PATH")
    if model_path:
        ModelService.load_model(model_path)
    else:
        logger.warning("No MODEL_PATH specified in configuration.")

    # Initialize tables and seed facilities in non-testing environments or when explicitly requested
    with app.app_context():
        if not app.config.get("TESTING"):
            try:
                db.create_all()
                seeded = seed_facilities_if_needed()
                if seeded > 0:
                    logger.info("Database initialized and %d facilities seeded.", seeded)
                else:
                    logger.info("Database verified; all 11 facilities already present.")
            except Exception as e:
                logger.error("Error initializing database tables: %s", str(e))

    return app
