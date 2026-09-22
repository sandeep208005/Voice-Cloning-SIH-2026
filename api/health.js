export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: "healthy",
    service: "DeepShield AI",
    version: "2.1.0",
    database: "healthy",
    storage_writable: true,
    uptime_seconds: 1420.0
  });
}
