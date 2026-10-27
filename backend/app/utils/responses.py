from flask import jsonify


def success_response(data=None, message="Success", status_code=200, meta=None):
    """Consistent format for successful API responses."""
    payload = {
        "status": "success",
        "message": message,
    }
    if data is not None:
        payload["data"] = data
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status_code


def error_response(message="An error occurred", status_code=400, errors=None):
    """Consistent format for error API responses with sanitized output."""
    payload = {
        "status": "error",
        "message": message,
    }
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status_code
