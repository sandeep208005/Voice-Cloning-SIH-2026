export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    id: "usr_forensic_analyst",
    email: "analyst@deepshield.ai",
    full_name: "Chief Forensic Analyst",
    role: "analyst",
    is_active: true,
    created_at: "2026-09-21 12:00:00"
  });
}
