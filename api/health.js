export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const providers = [];
  if (process.env.GEMINI_API_KEY) providers.push('gemini');
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_MODEL_VERSION) providers.push('replicate');
  return res.status(200).json({
    ok: true,
    platform: 'Vercel Serverless',
    service: 'AI Pro Studio V3 Proxy',
    provider: providers.length ? providers.join(', ') : 'local-only (add GEMINI_API_KEY in Vercel Env)',
    configured: providers.length > 0
  });
}
