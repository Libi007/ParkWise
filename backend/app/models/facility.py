from datetime import datetime, timezone
from app.extensions import db


class Facility(db.Model):
    """
    Facility database model representing a monitored parking facility.
    Stable identifiers (facility_code, source_uuid, reference_capacity) are protected
    from ordinary edits to maintain model alignment.
    """
    __tablename__ = "facilities"

    id = db.Column(db.Integer, primary_key=True)
    facility_code = db.Column(db.String(10), unique=True, nullable=False, index=True)
    source_uuid = db.Column(db.String(36), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=False)
    reference_capacity = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship to prediction history
    predictions = db.relationship(
        "PredictionRecord",
        backref="facility",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "facility_code": self.facility_code,
            "source_uuid": self.source_uuid,
            "display_name": self.display_name,
            "reference_capacity": self.reference_capacity,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
