export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }

  const email = body.email || 'analyst@deepshield.ai';
  const fullName = body.full_name || 'Forensic Analyst';
  const role = body.role || 'analyst';

  return res.status(200).json({
    access_token: "demo_jwt_session_token_deepshield_ai",
    token_type: "bearer",
    user: {
      id: "usr_" + Math.random().toString(36).slice(2, 8),
      email: email,
      full_name: fullName,
      role: role,
      is_active: true,
      created_at: new Date().toISOString()
    }
  });
}
