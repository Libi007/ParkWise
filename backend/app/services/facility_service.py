from app.extensions import db
from app.models.facility import Facility

# Exactly 11 trusted facilities from dataset specification
SEED_FACILITIES = [
    {
        "facility_code": "PF01",
        "display_name": "Parking Facility 01",
        "source_uuid": "3ac12f33-cd9d-43a2-a595-67c3262cd25f",
        "reference_capacity": 84,
    },
    {
        "facility_code": "PF02",
        "display_name": "Parking Facility 02",
        "source_uuid": "81155f5d-497d-4bf3-b7b5-e9912ba75632",
        "reference_capacity": 27,
    },
    {
        "facility_code": "PF03",
        "display_name": "Parking Facility 03",
        "source_uuid": "816c56b2-a5de-449f-a66a-eadddc1432fb",
        "reference_capacity": 71,
    },
    {
        "facility_code": "PF04",
        "display_name": "Parking Facility 04",
        "source_uuid": "9c0bb2df-8c90-4476-91bc-8b9b34c75133",
        "reference_capacity": 112,
    },
    {
        "facility_code": "PF05",
        "display_name": "Parking Facility 05",
        "source_uuid": "a668360d-b4c6-45ca-a2ab-16d5d0641dbe",
        "reference_capacity": 24,
    },
    {
        "facility_code": "PF06",
        "display_name": "Parking Facility 06",
        "source_uuid": "e1f4421c-81c4-4daf-944b-e73dfc36d5e4",
        "reference_capacity": 104,
    },
    {
        "facility_code": "PF07",
        "display_name": "Parking Facility 07",
        "source_uuid": "ecea9356-1026-4afc-98eb-dda9a63e187a",
        "reference_capacity": 94,
    },
    {
        "facility_code": "PF08",
        "display_name": "Parking Facility 08",
        "source_uuid": "efd74fae-42ce-4321-813b-80b57f2bfdd4",
        "reference_capacity": 243,
    },
    {
        "facility_code": "PF09",
        "display_name": "Parking Facility 09",
        "source_uuid": "fbf36ac7-f492-4017-b834-142a326c8703",
        "reference_capacity": 250,
    },
    {
        "facility_code": "PF10",
        "display_name": "Parking Facility 10",
        "source_uuid": "2cc6b90a-8460-4b11-a52e-5f9319ffd64b",
        "reference_capacity": 499,
    },
    {
        "facility_code": "PF11",
        "display_name": "Parking Facility 11",
        "source_uuid": "2e7daa83-19e3-4133-8d57-3911d7681d40",
        "reference_capacity": 238,
    },
]


def seed_facilities_if_needed():
    """
    Idempotent seeding of standard parking facilities.
    Custom display names set by users will NOT be overwritten during reseeding.
    """
    seeded_count = 0
    for item in SEED_FACILITIES:
        existing = Facility.query.filter_by(facility_code=item["facility_code"]).first()
        if not existing:
            facility = Facility(
                facility_code=item["facility_code"],
                source_uuid=item["source_uuid"],
                display_name=item["display_name"],
                reference_capacity=item["reference_capacity"],
                is_active=True,
            )
            db.session.add(facility)
            seeded_count += 1
    
    if seeded_count > 0:
        db.session.commit()
    return seeded_count


def get_all_facilities(active_only=False):
    """Retrieve all facilities sorted by facility_code."""
    query = Facility.query
    if active_only:
        query = query.filter_by(is_active=True)
    return query.order_by(Facility.facility_code.asc()).all()


def get_facility_by_code(facility_code):
    """Retrieve single facility by code."""
    return Facility.query.filter_by(facility_code=facility_code).first()


def update_facility(facility, data):
    """
    Update facility display name and/or active status.
    Protected fields (facility_code, source_uuid, reference_capacity) are never changed here.
    """
    if "display_name" in data:
        display_name = str(data["display_name"]).strip()
        if not display_name:
            raise ValueError("Display name cannot be empty.")
        if len(display_name) > 100:
            raise ValueError("Display name cannot exceed 100 characters.")
        facility.display_name = display_name

    if "is_active" in data:
        if not isinstance(data["is_active"], bool):
            raise ValueError("is_active must be a boolean.")
        facility.is_active = data["is_active"]

    db.session.commit()
    return facility
