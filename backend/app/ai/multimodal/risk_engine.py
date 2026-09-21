import math
from typing import Dict, Any, List, Optional


class MultimodalRiskEngine:
    """
    Transparent Bayesian risk engine that fuses independent evidence channels
    (acoustic, visual, temporal) into a calibrated threat score.
    """

    @staticmethod
    def fuse_evidence(
        audio_result: Optional[Dict[str, Any]] = None,
        image_result: Optional[Dict[str, Any]] = None,
        video_result: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Aggregates evidence across available modalities.
        Zero arbitrary weights: uses evidential log-odds pooling.
        """
        modalities_present = []
        log_odds_sum = 0.0
        explanations = []

        # Prior probability P(Fake) = 0.10 (conservative prior for organic threat modeling)
        prior_prob = 0.10
        prior_log_odds = math.log(prior_prob / (1.0 - prior_prob))
        log_odds_sum += prior_log_odds

        # 1. Audio channel evidence
        if audio_result and "synthetic_probability" in audio_result:
            p_audio = max(0.01, min(0.99, float(audio_result["synthetic_probability"])))
            conf_audio = float(audio_result.get("confidence", 0.8))
            # Weight log-likelihood ratio by model confidence
            llr_audio = conf_audio * (math.log(p_audio / (1.0 - p_audio)) - prior_log_odds)
            log_odds_sum += llr_audio
            modalities_present.append("audio")
            if p_audio >= 0.5:
                explanations.append(f"Acoustic anomaly score: {int(p_audio * 100)}%")

        # 2. Image / Visual channel evidence
        if image_result and "synthetic_probability" in image_result:
            p_image = max(0.01, min(0.99, float(image_result["synthetic_probability"])))
            conf_image = float(image_result.get("confidence", 0.8))
            llr_image = conf_image * (math.log(p_image / (1.0 - p_image)) - prior_log_odds)
            log_odds_sum += llr_image
            modalities_present.append("image")
            if p_image >= 0.5:
                explanations.append(f"Visual frequency anomaly score: {int(p_image * 100)}%")

        # 3. Video / Temporal channel evidence
        if video_result and "synthetic_probability" in video_result:
            p_video = max(0.01, min(0.99, float(video_result["synthetic_probability"])))
            conf_video = float(video_result.get("confidence", 0.85))
            llr_video = conf_video * (math.log(p_video / (1.0 - p_video)) - prior_log_odds)
            log_odds_sum += llr_video
            modalities_present.append("video")
            if p_video >= 0.5:
                explanations.append(f"Temporal consistency anomaly score: {int(p_video * 100)}%")

        # Convert posterior log-odds back to probability
        posterior_prob = 1.0 / (1.0 + math.exp(-max(-10.0, min(10.0, log_odds_sum))))
        posterior_prob = float(min(0.99, max(0.01, posterior_prob)))

        # Risk level determination
        if posterior_prob >= 0.70:
            risk_level = "high"
            classification = "likely_synthetic"
        elif posterior_prob >= 0.38:
            risk_level = "medium"
            classification = "suspicious"
        else:
            risk_level = "low"
            classification = "likely_authentic"

        return {
            "risk_level": risk_level,
            "classification": classification,
            "synthetic_probability": round(posterior_prob, 4),
            "modalities_evaluated": modalities_present,
            "evidence_summary": explanations,
            "fusion_method": "Bayesian Log-Odds Likelihood Ratio Pooling",
        }
