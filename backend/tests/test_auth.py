def test_register_and_login(client):
    # Register analyst
    payload = {
        "email": "forensic.lead@deepshield.ai",
        "password": "SecurePassword2026!",
        "full_name": "Dr. Sarah Lin",
        "role": "analyst",
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "forensic.lead@deepshield.ai"
    token = data["access_token"]

    # Access me with token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "forensic.lead@deepshield.ai"

    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "forensic.lead@deepshield.ai", "password": "SecurePassword2026!"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Reject wrong password
    bad_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "forensic.lead@deepshield.ai", "password": "WrongPassword!"},
    )
    assert bad_resp.status_code == 401
