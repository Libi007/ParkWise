from datetime import datetime, timezone
from flask import Blueprint, current_app
from sqlalchemy import text
from app.extensions import db
from app.services.model_service import ModelService
from app.models.facility import Facility
from app.utils.responses import success_response, error_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    """Liveness probe returning basic API service status."""
    return success_response(
        data={
            "status": "healthy",
            "service": "ParkWise — Smart Parking Occupancy Prediction System",
            "version": current_app.config.get("MODEL_VERSION", "1.0.0"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        message="Service is running"
    )


@health_bp.route("/health/ready", methods=["GET"])
def readiness():
    """
    Readiness probe verifying database connectivity, facility records, and model readiness.
    """
    db_ok = False
    facility_count = 0
    try:
        db.session.execute(text("SELECT 1"))
        facility_count = Facility.query.count()
        db_ok = True
    except Exception as e:
        db_error = str(e)

    model_ok = ModelService.is_loaded()
    model_error = ModelService.get_load_error()

    status_data = {
        "ready": db_ok and model_ok,
        "database": {
            "status": "connected" if db_ok else "disconnected",
            "facility_count": facility_count,
        },
        "model": {
            "status": "loaded" if model_ok else "not_loaded",
            "name": current_app.config.get("MODEL_NAME", "LightGBM-Regressor-Tuned"),
            "version": current_app.config.get("MODEL_VERSION", "1.0.0"),
            "error": model_error if not model_ok else None,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if db_ok and model_ok:
        return success_response(data=status_data, message="System is ready for predictions")
    else:
        return error_response(
            message="System is not fully ready",
            status_code=503,
            errors=status_data
        )
