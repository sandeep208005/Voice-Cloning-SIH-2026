export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    total_analyses: 11,
    audio_analyses: 6,
    image_analyses: 4,
    video_analyses: 1,
    suspicious_detections: 6,
    high_risk_analyses: 3,
    processing_failures: 0,
    risk_distribution: {
      low: 2,
      medium: 6,
      high: 3
    },
    classification_distribution: {
      likely_authentic: 2,
      suspicious: 6,
      likely_synthetic: 0
    },
    trends: [
      { date: "Sep 16", total: 0, synthetic: 0, authentic: 0 },
      { date: "Sep 17", total: 0, synthetic: 0, authentic: 0 },
      { date: "Sep 18", total: 0, synthetic: 0, authentic: 0 },
      { date: "Sep 19", total: 0, synthetic: 0, authentic: 0 },
      { date: "Sep 20", total: 0, synthetic: 0, authentic: 0 },
      { date: "Sep 21", total: 11, synthetic: 9, authentic: 2 },
      { date: "Sep 22", total: 0, synthetic: 0, authentic: 0 }
    ],
    unresolved_alerts_count: 3
  });
}
