/*
 * Spain trip — AI Concierge proxy (Cloudflare Worker)
 * ---------------------------------------------------
 * Holds the Claude API key so it never appears in the public web page.
 * The site POSTs { password, system, messages }; this Worker checks the
 * password, then calls the Anthropic Messages API and returns { text }.
 *
 * Required secrets (Worker → Settings → Variables, "Encrypt"):
 *   ANTHROPIC_API_KEY  – your key from https://console.anthropic.com
 *   APP_PASSWORD       – the family password (default site password: "coconut")
 * Optional:
 *   MODEL              – defaults to "claude-sonnet-4-6"
 *                        (use "claude-opus-4-8" for the most capable answers)
 *
 * Deploy: paste into a new Worker in the Cloudflare dashboard, or
 *   `wrangler deploy concierge-worker.js`. Full steps in SETUP.md.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400); }

    if (!env.APP_PASSWORD || body.password !== env.APP_PASSWORD) {
      return json({ error: 'Unauthorized — wrong family password.' }, 401);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'Server missing ANTHROPIC_API_KEY.' }, 500);
    }

    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-20)
      : [];
    if (!messages.length) return json({ error: 'No messages.' }, 400);

    let resp;
    try {
      resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: env.MODEL || 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: String(body.system || '').slice(0, 16000),
          messages,
        }),
      });
    } catch (e) {
      return json({ error: 'Could not reach Claude API.' }, 502);
    }

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json({ error: (data.error && data.error.message) || 'Claude API error.' }, resp.status);
    }

    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return json({ text: text || '(no response)' }, 200);
  },
};
