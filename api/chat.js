export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { message } = req.body;
  if (!message) { res.status(400).json({ error: 'No message provided' }); return; }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `You are the DGC Training Assistant for NZ hazardous substances training. Give SHORT answers — 1-2 sentences only. Be direct and practical. No bullet points, no lists, no headers. Just a plain conversational answer a shop floor worker can act on immediately. Focus on: GHS pictograms, SDS sheets, HSNO classes (2.1, 3.1, 8.1, 6.1), PPE, storage, spill response.`,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not get a response.';
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get response', details: error.message });
  }
}
