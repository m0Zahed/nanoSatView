from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_healthz() -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_markdown_generation() -> None:
    payload = {
        "projectName": "Demo Mission",
        "component": {"name": "Sensor Module", "type": "Electronics", "quantity": 2},
        "requirements": [{"id": "REQ-1", "title": "Must survive thermal cycle"}],
        "stack": [
            {
                "id": "blob-1",
                "type": "text",
                "title": "Context",
                "content": "Thermal considerations and expected environment.",
            }
        ],
    }

    response = client.post("/api/v1/markdown/from-stack", json=payload)
    assert response.status_code == 200
    markdown = response.json()["markdown"]
    assert "Demo Mission" in markdown
    assert "Sensor Module" in markdown
    assert "REQ-1" in markdown
