def test_get_project_outputs_endpoint(client):
    """Verifies that the /api/v1/dashboard/project-outputs endpoint returns full scientific metrics."""
    resp = client.get("/api/v1/dashboard/project-outputs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "model_architecture" in data
    assert "in_distribution_test" in data
    assert "out_of_distribution_test" in data
    assert "dataset_breakdown" in data
    assert "multimodal_modules" in data
    assert data["dataset_breakdown"]["total_samples"] >= 280

    # In-Distribution Metrics Verification
    in_dist = data["in_distribution_test"]["new_model"]
    assert in_dist["accuracy"] >= 0.90
    assert in_dist["recall"] == 1.0
    assert in_dist["roc_auc"] >= 0.98

    # Old Model Comparison Verification
    old_model = data["in_distribution_test"]["old_model"]
    assert old_model["accuracy"] <= 0.60
    assert old_model["recall"] == 0.0

    # Multimodal modules coverage
    modules = data["multimodal_modules"]
    assert "image" in modules
    assert "audio" in modules
    assert "video" in modules
    assert "verification" in modules
