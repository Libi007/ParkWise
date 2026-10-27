def test_health_endpoint(client):
    """Test GET /api/v1/health returns 200 with service information."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert "ParkWise" in data["data"]["service"]
    assert data["data"]["status"] == "healthy"


def test_readiness_endpoint(client):
    """Test GET /api/v1/health/ready verifies database and model state."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code in (200, 503)
    data = response.get_json()
    assert "database" in data["data"] or "errors" in data
