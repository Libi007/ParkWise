import pytest
from app.services.model_service import ModelService, FEATURES, TARGET


def test_missing_artifact_behavior():
    """Verify ModelService handles non-existent file gracefully without crashing."""
    success = ModelService.load_model("/path/to/nonexistent/model.pkl")
    assert success is False
    assert ModelService.is_loaded() is False
    assert "not found" in ModelService.get_load_error().lower()


def test_parking_status_thresholds():
    """Verify centralized parking occupancy thresholds."""
    assert ModelService.get_parking_status(0.0) == "Low"
    assert ModelService.get_parking_status(39.99) == "Low"
    assert ModelService.get_parking_status(40.0) == "Moderate"
    assert ModelService.get_parking_status(74.99) == "Moderate"
    assert ModelService.get_parking_status(75.0) == "High"
    assert ModelService.get_parking_status(89.99) == "High"
    assert ModelService.get_parking_status(90.0) == "Nearly Full"
    assert ModelService.get_parking_status(100.0) == "Nearly Full"


def test_real_model_inference(app):
    """Verify inference on real LightGBM pipeline with space calculation invariants."""
    # Ensure model is loaded from configured testing path
    ModelService.load_model(app.config["MODEL_PATH"])
    assert ModelService.is_loaded() is True

    features = {
        "facility_label": "PF01",
        "reference_capacity": 84,
        "time_slot": 42,
        "day_of_week": 1,
        "is_weekend": 0,
        "month": 10,
        "day_of_year": 293,
    }

    result = ModelService.predict(features)
    assert "raw_occupancy_percentage" in result
    assert "occupancy_percentage" in result
    assert "occupied_spaces" in result
    assert "available_spaces" in result
    assert "parking_status" in result

    # Invariants
    assert 0.0 <= result["occupancy_percentage"] <= 100.0
    assert result["occupied_spaces"] >= 0
    assert result["available_spaces"] >= 0
    assert result["occupied_spaces"] + result["available_spaces"] == 84
    assert result["parking_status"] in ("Low", "Moderate", "High", "Nearly Full")
