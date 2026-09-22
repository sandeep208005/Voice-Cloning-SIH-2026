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
  return res.status(200).json({
    access_token: "demo_jwt_session_token_deepshield_ai",
    token_type: "bearer",
    user: {
      id: "usr_forensic_analyst",
      email: email,
      full_name: body.full_name || (email.split('@')[0].toUpperCase() + " (Analyst)"),
      role: "analyst",
      is_active: true,
      created_at: new Date().toISOString()
    }
  });
}
