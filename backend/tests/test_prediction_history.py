def test_prediction_history_pagination(client):
    """Test GET /api/v1/predictions/history returns paginated results."""
    # Create two predictions
    client.post("/api/v1/predictions", json={
        "facility_code": "PF01",
        "datetime": "2026-10-20T10:00:00+02:00"
    })
    client.post("/api/v1/predictions", json={
        "facility_code": "PF02",
        "datetime": "2026-10-20T11:00:00+02:00"
    })

    resp = client.get("/api/v1/predictions/history?page=1&page_size=10")
    assert resp.status_code == 200
    json_data = resp.get_json()
    assert json_data["status"] == "success"
    assert "data" in json_data
    assert "meta" in json_data
    assert json_data["meta"]["total_items"] >= 2
    assert len(json_data["data"]) >= 2


def test_prediction_history_facility_filter(client):
    """Test filtering prediction history by facility_code."""
    client.post("/api/v1/predictions", json={
        "facility_code": "PF03",
        "datetime": "2026-10-20T12:00:00+02:00"
    })

    resp = client.get("/api/v1/predictions/history?facility_code=PF03")
    assert resp.status_code == 200
    items = resp.get_json()["data"]
    for item in items:
        assert item["facility"]["facility_code"] == "PF03"


def test_get_single_prediction_by_id(client):
    """Test GET /api/v1/predictions/<id>."""
    create_resp = client.post("/api/v1/predictions", json={
        "facility_code": "PF04",
        "datetime": "2026-10-20T14:00:00+02:00"
    })
    pred_id = create_resp.get_json()["data"]["prediction_id"]

    resp = client.get(f"/api/v1/predictions/{pred_id}")
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["id"] == pred_id
    assert data["facility"]["facility_code"] == "PF04"

    # Nonexistent id
    resp_404 = client.get("/api/v1/predictions/999999")
    assert resp_404.status_code == 404


def test_clear_prediction_history(client):
    """Test DELETE /api/v1/predictions/history clears all records."""
    client.post("/api/v1/predictions", json={
        "facility_code": "PF01",
        "datetime": "2026-10-20T10:00:00+02:00"
    })
    del_resp = client.delete("/api/v1/predictions/history")
    assert del_resp.status_code == 200
    assert del_resp.get_json()["status"] == "success"

    get_resp = client.get("/api/v1/predictions/history")
    assert get_resp.status_code == 200
    assert get_resp.get_json()["meta"]["total_items"] == 0
