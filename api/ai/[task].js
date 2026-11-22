export const config = {
  api: { bodyParser: { sizeLimit: '12mb' } }
};

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  return { mimeType: m[1] === 'image/jpg' ? 'image/jpeg' : m[1], base64: m[2] };
}

function buildPrompt(taskType, body) {
  if (body.prompt && String(body.prompt).trim()) return String(body.prompt).trim();
  if (taskType === 'virtual-try-on') return `Dress the person in a realistic ${body.color || ''} ${body.fabric || ''} ${body.outfit || 'outfit'}. Preserve face, pose, skin tone, and background.`;
  if (taskType === 'hairstyle') return `Give the person a realistic ${body.hairstyle || 'modern'} hairstyle${body.hairColor ? ' in ' + body.hairColor : ''}. Keep face and background identical.`;
  if (taskType === 'enhance') return 'Professionally enhance this photo to crisp high-resolution studio quality, remove noise, balance natural skin tones and details.';
  return 'Photorealistic high-resolution studio photography backdrop with cinematic depth of field.';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  const taskType = req.query.task || 'prompt-edit';
  const body = req.body || {};

  try {
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
      const parts = [{ text: buildPrompt(taskType, body) }];
      const mainImg = parseDataUrl(body.imageDataUrl);
      if (mainImg) parts.push({ inline_data: { mime_type: mainImg.mimeType, data: mainImg.base64 } });
      const gImg = parseDataUrl(body.garmentDataUrl);
      if (gImg) parts.push({ inline_data: { mime_type: gImg.mimeType, data: gImg.base64 } });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return res.status(resp.status).json({ ok: false, error: data.error?.message || 'Gemini API error' });
      const resParts = data.candidates?.[0]?.content?.parts || [];
      const imgPart = resParts.find((p) => p.inlineData?.data || p.inline_data?.data);
      if (imgPart) {
        const inline = imgPart.inlineData || imgPart.inline_data;
        const mime = inline.mimeType || inline.mime_type || 'image/png';
        return res.status(200).json({ ok: true, imageDataUrl: `data:${mime};base64,${inline.data}`, meta: { provider: 'gemini', model } });
      }
      return res.status(502).json({ ok: false, error: 'Gemini returned no image data.' });
    }

    if (process.env.OPENAI_API_KEY) {
      const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model, prompt: buildPrompt(taskType, body), size: '1024x1024' })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return res.status(resp.status).json({ ok: false, error: data.error?.message || 'OpenAI error' });
      const b64 = data.data?.[0]?.b64_json;
      if (b64) return res.status(200).json({ ok: true, imageDataUrl: `data:image/png;base64,${b64}`, meta: { provider: 'openai', model } });
    }

    return res.status(503).json({ ok: false, error: 'No API key configured in Vercel Environment Variables (add GEMINI_API_KEY).' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
}
