from app.models.facility import Facility
from app.services.facility_service import seed_facilities_if_needed, SEED_FACILITIES


def test_facilities_seeded_correctly(session):
    """Verify all 11 facilities are seeded with exact capacities and codes."""
    facilities = Facility.query.order_by(Facility.facility_code.asc()).all()
    assert len(facilities) == 11

    codes = [f.facility_code for f in facilities]
    expected_codes = [f"PF{i:02d}" for i in range(1, 12)]
    assert codes == expected_codes

    for seed in SEED_FACILITIES:
        fac = Facility.query.filter_by(facility_code=seed["facility_code"]).first()
        assert fac is not None
        assert fac.reference_capacity == seed["reference_capacity"]
        assert fac.source_uuid == seed["source_uuid"]


def test_list_facilities_api(client):
    """Verify GET /api/v1/facilities returns list of all facilities."""
    response = client.get("/api/v1/facilities")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert len(data["data"]) == 11


def test_get_single_facility_api(client):
    """Verify GET /api/v1/facilities/<facility_code>."""
    response = client.get("/api/v1/facilities/PF01")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["facility_code"] == "PF01"
    assert data["reference_capacity"] == 84

    # Nonexistent facility
    resp_404 = client.get("/api/v1/facilities/PF99")
    assert resp_404.status_code == 404


def test_patch_display_name_and_idempotent_reseeding(client, session):
    """Verify editing display name succeeds and survives reseeding."""
    new_name = "Central Station Parking"
    resp = client.patch(
        "/api/v1/facilities/PF01",
        json={"display_name": new_name}
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["display_name"] == new_name

    # Reseed facilities
    seed_facilities_if_needed()

    # Verify custom name survived
    fac = Facility.query.filter_by(facility_code="PF01").first()
    assert fac.display_name == new_name


def test_patch_forbidden_fields_rejected(client):
    """Verify attempts to modify capacity, UUID, or code are rejected."""
    resp = client.patch(
        "/api/v1/facilities/PF01",
        json={"reference_capacity": 500}
    )
    assert resp.status_code == 400
    assert "not permitted" in resp.get_json()["message"]


def test_patch_empty_display_name_rejected(client):
    """Verify empty display name is rejected with 400."""
    resp = client.patch(
        "/api/v1/facilities/PF01",
        json={"display_name": "   "}
    )
    assert resp.status_code == 400
