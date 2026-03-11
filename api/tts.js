export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  
  // Health check for GET requests
  if (req.method === 'GET') {
    res.status(200).json({ 
      status: 'ok',
      key_present: !!process.env.ELEVENLABS_API_KEY,
      key_prefix: process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.substring(0, 8) : 'MISSING'
    });
    return;
  }

  const text = req.body && req.body.text;
  if (!text) { res.status(400).json({ error: 'No text provided' }); return; }

  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - free tier
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    res.status(500).json({ error: 'ELEVENLABS_API_KEY not set in environment' });
    return;
  }

  try {
    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
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
      }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      res.status(500).json({
        error: 'ElevenLabs rejected request',
        http_status: elResponse.status,
        details: errText
      });
      return;
    }

    const audioBuffer = await elResponse.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (err) {
    res.status(500).json({ error: 'Caught exception', message: err.message, stack: err.stack });
  }
}
