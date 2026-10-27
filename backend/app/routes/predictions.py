from datetime import datetime
from flask import Blueprint, request, current_app
from app.extensions import db
from app.models.facility import Facility
from app.models.prediction import PredictionRecord
from app.services.facility_service import get_facility_by_code
from app.services.timezone_service import (
    parse_and_normalize_datetime,
    extract_features_from_datetime,
)
from app.services.model_service import ModelService
from app.schemas.validators import validate_prediction_input, validate_pagination_args
from app.utils.responses import success_response, error_response

predictions_bp = Blueprint("predictions", __name__)


@predictions_bp.route("/predictions", methods=["POST"])
def create_prediction():
    """
    Generate an occupancy forecast for a given parking facility and date/time.
    Loads trusted capacity and labels strictly from database, derives all 7 temporal features,
    and records successful forecast to history.
    """
    json_data = request.get_json(silent=True)
    validated_data, err = validate_prediction_input(json_data)
    if err:
        return error_response(message=err, status_code=400)

    facility_code = validated_data["facility_code"].upper().strip()
    facility = get_facility_by_code(facility_code)
    if not facility:
        return error_response(
            message=f"Parking facility '{facility_code}' is not recognized.",
            status_code=404
        )

    if not facility.is_active:
        return error_response(
            message=f"Facility '{facility.display_name}' ({facility_code}) is currently marked inactive.",
            status_code=400
        )

    # Timezone parsing and feature extraction
    try:
        local_dt, utc_dt, effective_tz = parse_and_normalize_datetime(
            validated_data["datetime"]
        )
    except Exception as e:
        return error_response(
            message=f"Could not parse datetime: {str(e)}",
            status_code=400
        )

    features = extract_features_from_datetime(
        local_dt=local_dt,
        facility_label=facility.facility_code,
        reference_capacity=facility.reference_capacity,
    )

    # Model inference
    try:
        pred_result = ModelService.predict(features)
    except RuntimeError as re:
        return error_response(message=str(re), status_code=503)
    except Exception as e:
        return error_response(
            message="An unexpected error occurred during prediction inference.",
            status_code=500
        )

    # Save to history table
    model_name = current_app.config.get("MODEL_NAME", "LightGBM-Regressor-Tuned")
    model_version = current_app.config.get("MODEL_VERSION", "1.0.0")

    record = PredictionRecord(
        facility_id=facility.id,
        requested_datetime=local_dt.replace(tzinfo=None),
        timezone=effective_tz,
        occupancy_percentage=pred_result["occupancy_percentage"],
        raw_occupancy_percentage=pred_result["raw_occupancy_percentage"],
        occupied_spaces=pred_result["occupied_spaces"],
        available_spaces=pred_result["available_spaces"],
        model_name=model_name,
        model_version=model_version,
    )

    db.session.add(record)
    db.session.commit()

    response_data = {
        "prediction_id": record.id,
        "facility_code": facility.facility_code,
        "display_name": facility.display_name,
        "reference_capacity": facility.reference_capacity,
        "requested_datetime": local_dt.replace(tzinfo=None).isoformat(),
        "requested_datetime_utc": utc_dt.isoformat(),
        "effective_timezone": effective_tz,
        "occupancy_percentage": pred_result["occupancy_percentage"],
        "raw_occupancy_percentage": pred_result["raw_occupancy_percentage"],
        "occupied_spaces": pred_result["occupied_spaces"],
        "available_spaces": pred_result["available_spaces"],
        "parking_status": pred_result["parking_status"],
        "model_name": model_name,
        "model_version": model_version,
        "disclaimer": "Predicted occupancy based on historical parking patterns in The Hague / Scheveningen. This is a statistical forecast, not a live measurement.",
    }

    return success_response(
        data=response_data,
        message="Occupancy prediction generated successfully.",
        status_code=201
    )


@predictions_bp.route("/predictions/history", methods=["GET"])
def get_prediction_history():
    """
    Retrieve paginated past forecast history with optional facility and date filters.
    """
    page, page_size = validate_pagination_args(request.args)
    facility_code = request.args.get("facility_code")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = PredictionRecord.query.join(Facility)

    if facility_code:
        query = query.filter(Facility.facility_code == facility_code.upper().strip())

    if start_date:
        try:
            start_local, _, _ = parse_and_normalize_datetime(start_date)
            query = query.filter(PredictionRecord.requested_datetime >= start_local.replace(tzinfo=None))
        except Exception:
            pass

    if end_date:
        try:
            end_local, _, _ = parse_and_normalize_datetime(end_date)
            query = query.filter(PredictionRecord.requested_datetime <= end_local.replace(tzinfo=None))
        except Exception:
            pass

    # Order by newest prediction record first
    query = query.order_by(PredictionRecord.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return success_response(
        data=[item.to_dict() for item in items],
        meta={
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
    )


@predictions_bp.route("/predictions/<int:prediction_id>", methods=["GET"])
def get_prediction_by_id(prediction_id):
    """Retrieve details for a single saved prediction forecast."""
    record = db.session.get(PredictionRecord, prediction_id)
    if not record:
        return error_response(
            message=f"Prediction record #{prediction_id} not found.",
            status_code=404
        )
    return success_response(data=record.to_dict())


@predictions_bp.route("/predictions/history", methods=["DELETE"])
def clear_prediction_history():
    """
    Clear all stored forecast history records from the database.
    """
    deleted_count = db.session.query(PredictionRecord).delete()
    db.session.commit()
    return success_response(
        data={"deleted_count": deleted_count},
        message=f"Successfully cleared {deleted_count} forecast history records."
    )
