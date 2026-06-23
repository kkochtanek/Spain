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
 *   GOOGLE_PLACES_KEY  – a Google Places API (New) key. When set, every Maps
 *                        link is prefixed with the place's live star rating
 *                        and review count. Omit it and links still work.
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

// Regex for the Google Maps links the concierge produces:
//   [📍 Map](https://www.google.com/maps/search/?api=1&query=ENCODED)
const MAPS_LINK_RE = /\[([^\]]*)\]\((https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=([^)\s]+))\)/g;

// Look up one place's live rating + review count via the Places API (New).
async function placeRating(query, key) {
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.rating,places.userRatingCount',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  const d = await resp.json().catch(() => ({}));
  const p = d.places && d.places[0];
  if (p && typeof p.rating === 'number') {
    return { rating: p.rating, count: p.userRatingCount || 0 };
  }
  return null;
}

// Prefix each Maps link with its live "4.5★ · 3,204 reviews · ". Links with no
// match are left untouched (never invent numbers).
async function enrichWithRatings(text, key) {
  const queries = [];
  let m;
  while ((m = MAPS_LINK_RE.exec(text)) !== null) {
    if (queries.indexOf(m[3]) === -1) queries.push(m[3]);
  }
  MAPS_LINK_RE.lastIndex = 0;
  if (!queries.length) return text;

  const capped = queries.slice(0, 8); // cap lookups to control cost + latency
  const ratings = {};
  await Promise.all(
    capped.map(async (q) => {
      try {
        const human = decodeURIComponent(q.replace(/\+/g, ' '));
        const info = await placeRating(human, key);
        if (info) ratings[q] = info;
      } catch (e) { /* ignore a single failed lookup */ }
    })
  );

  return text.replace(MAPS_LINK_RE, (full, label, url, q) => {
    const info = ratings[q];
    if (!info) return full;
    const stars = info.rating.toFixed(1) + '★';
    const reviews = info.count ? ' · ' + info.count.toLocaleString('en-US') + ' reviews' : '';
    return stars + reviews + ' · [' + label + '](' + url + ')';
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

    let text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim() || '(no response)';

    // If a Places key is configured, add live ratings to each Maps link.
    if (env.GOOGLE_PLACES_KEY) {
      try { text = await enrichWithRatings(text, env.GOOGLE_PLACES_KEY); } catch (e) { /* keep plain text */ }
    }

    return json({ text }, 200);
  },
};
