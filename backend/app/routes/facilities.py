from flask import Blueprint, request
from app.services.facility_service import (
    get_all_facilities,
    get_facility_by_code,
    update_facility,
)
from app.schemas.validators import validate_facility_patch_input
from app.utils.responses import success_response, error_response

facilities_bp = Blueprint("facilities", __name__)


@facilities_bp.route("/facilities", methods=["GET"])
def list_facilities():
    """Retrieve all parking facilities."""
    active_only = request.args.get("active_only", "").lower() in ("true", "1")
    facilities = get_all_facilities(active_only=active_only)
    return success_response(
        data=[f.to_dict() for f in facilities],
        meta={"count": len(facilities), "active_only": active_only}
    )


@facilities_bp.route("/facilities/<facility_code>", methods=["GET"])
def get_facility(facility_code):
    """Retrieve details for a single parking facility."""
    facility = get_facility_by_code(facility_code.upper().strip())
    if not facility:
        return error_response(
            message=f"Facility '{facility_code}' not found.",
            status_code=404
        )
    return success_response(data=facility.to_dict())


@facilities_bp.route("/facilities/<facility_code>", methods=["PATCH"])
def patch_facility(facility_code):
    """
    Update facility display name or active status.
    Protected attributes (facility_code, capacity, UUID) cannot be edited.
    NOTE: In production, this administrative route should be guarded with authentication.
    """
    facility = get_facility_by_code(facility_code.upper().strip())
    if not facility:
        return error_response(
            message=f"Facility '{facility_code}' not found.",
            status_code=404
        )

    json_data = request.get_json(silent=True)
    validated_data, err = validate_facility_patch_input(json_data)
    if err:
        return error_response(message=err, status_code=400)

    try:
        updated = update_facility(facility, validated_data)
        return success_response(
            data=updated.to_dict(),
            message=f"Facility {facility_code} updated successfully."
        )
    except ValueError as ve:
        return error_response(message=str(ve), status_code=400)
    except Exception as e:
        return error_response(message="An error occurred while updating facility.", status_code=500)
