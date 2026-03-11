export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'GET') {
    res.status(200).json({ status: 'ok', key_present: !!process.env.ELEVENLABS_API_KEY });
    return;
  }

  // Robustly extract text from body regardless of how Vercel parsed it
  let text, lang;
  try {
    const raw = req.body;
    const parsed = (typeof raw === 'string') ? JSON.parse(raw) : (raw || {});
    text = parsed.text;
    lang = parsed.lang || 'en';
  } catch(e) {
    res.status(400).json({ error: 'Could not parse body', raw: String(req.body).substring(0,200) });
    return;
  }

  if (!text) {
    res.status(400).json({ error: 'text field missing', body: String(req.body).substring(0,200) });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ELEVENLABS_API_KEY missing from environment' });
    return;
  }

  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      res.status(500).json({ error: 'ElevenLabs error', status: r.status, details: errText });
      return;
    }

    const buf = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(buf));

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
