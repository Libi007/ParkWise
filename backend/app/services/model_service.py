import os
import pickle
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# Exact 7 features and column order expected by the trained pipeline
FEATURES = [
    "facility_label",
    "reference_capacity",
    "time_slot",
    "day_of_week",
    "is_weekend",
    "month",
    "day_of_year",
]

TARGET = "occupancy_percentage"


class ModelService:
    """
    Singleton service for loading and executing the LightGBM regression pipeline.
    Reuses the serialized sklearn Pipeline across all prediction requests.
    """
    _pipeline = None
    _model_path = None
    _load_error = None

    @classmethod
    def load_model(cls, model_path):
        """Load the trained model pipeline from disk using pickle."""
        cls._model_path = model_path
        if not os.path.exists(model_path):
            cls._load_error = f"Model artifact not found at: {model_path}"
            logger.error(cls._load_error)
            cls._pipeline = None
            return False

        try:
            with open(model_path, "rb") as f:
                cls._pipeline = pickle.load(f)
            cls._load_error = None
            logger.info("Successfully loaded ParkWise LightGBM pipeline from %s", model_path)
            return True
        except Exception as e:
            cls._load_error = f"Failed to load model artifact: {str(e)}"
            logger.exception("Error unpickling model from %s", model_path)
            cls._pipeline = None
            return False

    @classmethod
    def is_loaded(cls):
        """Check whether the model pipeline is loaded and ready."""
        return cls._pipeline is not None

    @classmethod
    def get_load_error(cls):
        """Return load error message if any."""
        return cls._load_error

    @classmethod
    def get_parking_status(cls, occupancy_percentage):
        """
        Determine centralized parking occupancy status badge text:
        - Below 40%: Low
        - 40% to below 75%: Moderate
        - 75% to below 90%: High
        - 90% to 100%: Nearly Full
        """
        occ = float(occupancy_percentage)
        if occ < 40.0:
            return "Low"
        elif occ < 75.0:
            return "Moderate"
        elif occ < 90.0:
            return "High"
        else:
            return "Nearly Full"

    @classmethod
    def predict(cls, feature_dict):
        """
        Execute prediction pipeline.
        feature_dict must contain all 7 FEATURES.
        Returns:
            dict with raw_occupancy_percentage, clipped_occupancy_percentage,
            occupied_spaces, available_spaces, and parking_status.
        """
        if not cls.is_loaded():
            raise RuntimeError(
                cls._load_error or "Prediction model is not loaded. Please verify the model artifact."
            )

        # Construct single-row DataFrame with exact columns in exact order
        row_data = {feat: [feature_dict[feat]] for feat in FEATURES}
        df = pd.DataFrame(row_data)

        # Run inference through complete fitted pipeline
        raw_pred = float(cls._pipeline.predict(df)[0])
        
        # Clip to physically valid range [0, 100]
        clipped_pred = float(np.clip(raw_pred, 0.0, 100.0))

        capacity = int(feature_dict["reference_capacity"])
        # Calculate spaces ensuring they sum to reference_capacity
        occupied_spaces = int(round(capacity * (clipped_pred / 100.0)))
        # Guard in case rounding pushes occupied over capacity
        occupied_spaces = max(0, min(occupied_spaces, capacity))
        available_spaces = capacity - occupied_spaces

        status = cls.get_parking_status(clipped_pred)

        return {
            "raw_occupancy_percentage": raw_pred,
            "occupancy_percentage": clipped_pred,
            "occupied_spaces": occupied_spaces,
            "available_spaces": available_spaces,
            "parking_status": status,
        }
