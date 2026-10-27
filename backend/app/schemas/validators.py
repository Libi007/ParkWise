from datetime import datetime
from dateutil import parser as date_parser


def validate_prediction_input(data):
    """Validate POST /api/v1/predictions request body."""
    if not isinstance(data, dict):
        return None, "Request body must be a valid JSON object."

    facility_code = data.get("facility_code")
    if not facility_code or not isinstance(facility_code, str):
        return None, "Field 'facility_code' is required and must be a non-empty string."
    facility_code = facility_code.strip()

    dt_str = data.get("datetime")
    if not dt_str or not isinstance(dt_str, str):
        return None, "Field 'datetime' is required and must be an ISO 8601 formatted string."
    dt_str = dt_str.strip()

    try:
        # Verify it can be parsed as a valid datetime
        date_parser.parse(dt_str)
    except Exception:
        return None, f"Invalid 'datetime' format: '{dt_str}'. Must be a valid ISO 8601 datetime string."

    return {
        "facility_code": facility_code,
        "datetime": dt_str,
    }, None


def validate_facility_patch_input(data):
    """Validate PATCH /api/v1/facilities/<facility_code> request body."""
    if not isinstance(data, dict):
        return None, "Request body must be a valid JSON object."

    # Check for forbidden fields that must never be altered through standard patch
    forbidden_fields = {"facility_code", "source_uuid", "reference_capacity", "id"}
    attempted_forbidden = forbidden_fields.intersection(data.keys())
    if attempted_forbidden:
        return None, f"Modification of protected attributes {list(attempted_forbidden)} is not permitted."

    validated = {}

    if "display_name" in data:
        val = data["display_name"]
        if not isinstance(val, str) or not val.strip():
            return None, "Field 'display_name' must be a non-empty string."
        val = val.strip()
        if len(val) > 100:
            return None, "Field 'display_name' cannot exceed 100 characters."
        validated["display_name"] = val

    if "is_active" in data:
        val = data["is_active"]
        if not isinstance(val, bool):
            return None, "Field 'is_active' must be a boolean (true or false)."
        validated["is_active"] = val

    if not validated:
        return None, "At least one of 'display_name' or 'is_active' must be provided for update."

    return validated, None


def validate_pagination_args(args):
    """Validate query parameters for pagination."""
    try:
        page = int(args.get("page", 1))
        if page < 1:
            page = 1
    except (ValueError, TypeError):
        page = 1

    try:
        page_size = int(args.get("page_size", 20))
        if page_size < 1:
            page_size = 20
        elif page_size > 100:
            page_size = 100
    except (ValueError, TypeError):
        page_size = 20

    return page, page_size
