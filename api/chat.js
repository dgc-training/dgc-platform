export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { message, userName, organisation } = req.body;
  if (!message) { res.status(400).json({ error: 'No message provided' }); return; }

  const isSlideNarration = message.startsWith('Rewrite this slide content');
  const userContext = userName ? `The user's name is ${userName}${organisation ? ` and they work at ${organisation}` : ''}.` : '';

  const system = isSlideNarration
    ? `You are a warm, friendly NZ workplace trainer explaining hazardous substances training to shop floor workers. Speak naturally like you're standing in front of them. Take your time — explain the topic fully, why it matters, and give a practical example from a workplace. 5-8 sentences. Conversational, no bullet points, no headings.`
    : `You are the DGC Training Assistant. ${userContext} Help with: hazardous substances (GHS, SDS, HSNO classes, PPE, storage, spills), AND platform questions (courses, certificates, progress, login). Refuse unrelated topics politely. Answer in ONE short sentence only, max 20 words.`;

  const maxTokens = isSlideNarration ? 400 : 60;

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
        max_tokens: maxTokens,
        system,
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
