from app.models.prediction import PredictionRecord


def test_valid_prediction_request(client):
    """Test valid POST /api/v1/predictions returns 201 and valid response structure."""
    payload = {
        "facility_code": "PF01",
        "datetime": "2026-10-20T10:30:00+02:00"
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 201
    data = response.get_json()["data"]

    assert data["facility_code"] == "PF01"
    assert data["reference_capacity"] == 84
    assert 0.0 <= data["occupancy_percentage"] <= 100.0
    assert data["occupied_spaces"] + data["available_spaces"] == 84
    assert data["parking_status"] in ("Low", "Moderate", "High", "Nearly Full")
    assert "prediction_id" in data
    assert "disclaimer" in data

    from app.extensions import db
    # Verify saved in DB
    record = db.session.get(PredictionRecord, data["prediction_id"])
    assert record is not None
    assert record.occupied_spaces == data["occupied_spaces"]


def test_prediction_invalid_facility(client):
    """Test prediction for non-existent facility returns 404."""
    payload = {
        "facility_code": "PF99",
        "datetime": "2026-10-20T10:30:00+02:00"
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 404


def test_prediction_invalid_datetime_format(client):
    """Test malformed datetime string returns 400."""
    payload = {
        "facility_code": "PF01",
        "datetime": "not-a-datetime"
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 400


def test_prediction_missing_fields(client):
    """Test missing fields return 400."""
    resp1 = client.post("/api/v1/predictions", json={"facility_code": "PF01"})
    assert resp1.status_code == 400

    resp2 = client.post("/api/v1/predictions", json={"datetime": "2026-10-20T10:30:00Z"})
    assert resp2.status_code == 400
