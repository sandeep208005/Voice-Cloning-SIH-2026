export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json([
    {
      id: "rec_aud_01",
      media_type: "audio",
      original_filename: "suspect_voice_sample_vocoder.wav",
      risk_level: "high",
      classification: "suspicious",
      synthetic_probability: 0.884,
      confidence: 0.92,
      created_at: "2026-09-21 14:32:10"
    },
    {
      id: "rec_img_02",
      media_type: "image",
      original_filename: "profile_face_diffusion_v6.jpg",
      risk_level: "medium",
      classification: "suspicious",
      synthetic_probability: 0.682,
      confidence: 0.89,
      created_at: "2026-09-21 13:18:45"
    },
    {
      id: "rec_vid_03",
      media_type: "video",
      original_filename: "executive_briefing_tampered.mp4",
      risk_level: "high",
      classification: "suspicious",
      synthetic_probability: 0.912,
      confidence: 0.95,
      created_at: "2026-09-21 11:05:22"
    },
    {
      id: "rec_aud_04",
      media_type: "audio",
      original_filename: "customer_id_verify_clean.wav",
      risk_level: "low",
      classification: "likely_authentic",
      synthetic_probability: 0.124,
      confidence: 0.94,
      created_at: "2026-09-21 09:40:11"
    }
  ]);
}
