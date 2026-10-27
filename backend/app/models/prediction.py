from datetime import datetime, timezone
from app.extensions import db


class PredictionRecord(db.Model):
    """
    Stores past prediction forecasts.
    IMPORTANT: This table documents model-generated forecasts, not live ground-truth observations.
    """
    __tablename__ = "prediction_records"

    id = db.Column(db.Integer, primary_key=True)
    facility_id = db.Column(
        db.Integer,
        db.ForeignKey("facilities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    requested_datetime = db.Column(db.DateTime, nullable=False, index=True)
    timezone = db.Column(db.String(50), nullable=False)
    occupancy_percentage = db.Column(db.Float, nullable=False)
    raw_occupancy_percentage = db.Column(db.Float, nullable=False)
    occupied_spaces = db.Column(db.Integer, nullable=False)
    available_spaces = db.Column(db.Integer, nullable=False)
    model_name = db.Column(db.String(100), nullable=False)
    model_version = db.Column(db.String(50), nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    def to_dict(self):
        facility_info = None
        if self.facility:
            facility_info = {
                "facility_code": self.facility.facility_code,
                "display_name": self.facility.display_name,
                "reference_capacity": self.facility.reference_capacity,
            }

        created_at_dt = self.created_at
        if created_at_dt and created_at_dt.tzinfo is None:
            created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)

        return {
            "id": self.id,
            "facility_id": self.facility_id,
            "facility": facility_info,
            "requested_datetime": self.requested_datetime.isoformat() if self.requested_datetime else None,
            "timezone": self.timezone,
            "occupancy_percentage": round(self.occupancy_percentage, 2),
            "raw_occupancy_percentage": round(self.raw_occupancy_percentage, 4),
            "occupied_spaces": self.occupied_spaces,
            "available_spaces": self.available_spaces,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "created_at": created_at_dt.isoformat() if created_at_dt else None,
        }
