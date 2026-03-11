export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { text, lang } = req.body;
  if (!text) { res.status(400).json({ error: 'No text' }); return; }

  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      // Return FULL error so we can debug
      res.status(500).json({ 
        error: 'ElevenLabs error', 
        status: response.status,
        details: err,
        key_present: !!process.env.ELEVENLABS_API_KEY,
        key_prefix: process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.substring(0,8) : 'MISSING'
      });
      return;
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
