from app.models.analysis import Analysis


def test_dashboard_empty_state_zero_demo_data(client):
    """
    CRITICAL RULE TEST: When no analyses exist, the dashboard must return
    zero counts and empty distributions. Never invent mock numbers.
    """
    resp = client.get("/api/v1/dashboard/statistics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_analyses"] == 0
    assert data["audio_analyses"] == 0
    assert data["image_analyses"] == 0
    assert data["video_analyses"] == 0
    assert data["suspicious_detections"] == 0
    assert data["high_risk_analyses"] == 0
    assert data["processing_failures"] == 0
    assert data["risk_distribution"] == {"low": 0, "medium": 0, "high": 0}
    assert data["classification_distribution"] == {
        "likely_authentic": 0,
        "suspicious": 0,
        "likely_synthetic": 0,
    }
    assert data["trends"] == []

    # Recent list must also be strictly empty
    recent_resp = client.get("/api/v1/dashboard/recent")
    assert recent_resp.status_code == 200
    assert recent_resp.json() == []


def test_dashboard_statistics_updates_with_real_records(client, db_session):
    """Verifies that inserting actual database records correctly reflects in statistics."""
    analysis1 = Analysis(
        media_type="audio",
        original_filename="sample_intercept.wav",
        stored_filename="uuid1.wav",
        file_size_bytes=1024,
        mime_type="audio/wav",
        status="completed",
        classification="likely_synthetic",
        confidence=0.92,
        synthetic_probability=0.88,
        risk_level="high",
        model_name="DeepShield-AcousticForensics-v1",
        model_version="1.2.0",
        processing_time_ms=120,
    )
    analysis2 = Analysis(
        media_type="image",
        original_filename="executive_id.jpg",
        stored_filename="uuid2.jpg",
        file_size_bytes=2048,
        mime_type="image/jpeg",
        status="completed",
        classification="likely_authentic",
        confidence=0.85,
        synthetic_probability=0.12,
        risk_level="low",
        model_name="DeepShield-VisualForensics-v1",
        model_version="1.2.0",
        processing_time_ms=95,
    )
    db_session.add_all([analysis1, analysis2])
    db_session.commit()

    resp = client.get("/api/v1/dashboard/statistics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_analyses"] == 2
    assert data["audio_analyses"] == 1
    assert data["image_analyses"] == 1
    assert data["high_risk_analyses"] == 1
    assert data["risk_distribution"]["high"] == 1
    assert data["risk_distribution"]["low"] == 1
    assert len(data["trends"]) == 7

    recent_resp = client.get("/api/v1/dashboard/recent")
    assert len(recent_resp.json()) == 2
