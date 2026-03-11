export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, key: !!process.env.ELEVENLABS_API_KEY });
    return;
  }

  const text = req.body?.text || 'Hello';

  const voicesRes = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
  });
  const voicesData = await voicesRes.json();
  const voiceId = voicesData.voices?.[0]?.voice_id;
  if (!voiceId) {
    res.status(500).json({ error: 'no voices' });
    return;
  }

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    })
  });

  if (!r.ok) {
    const e = await r.text();
    res.status(500).json({ error: 'elevenlabs', status: r.status, body: e });
    return;
  }

  // Return as base64 JSON so browser can decode it reliably
  const buf = await r.arrayBuffer();
  const base64 = Buffer.from(buf).toString('base64');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ audio: base64 });
}
