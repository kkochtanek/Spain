# Spain 2026 — Itinerary & Bookings App

A single-page itinerary for the Kochtanek family trip (`index.html`, served via
GitHub Pages). `spain-itinerary.html` is an identical copy.

## What's in it

- **Trip at a glance** — days/nights breakdown per city.
- **City tabs** — day-by-day plans, plus my **Concierge picks** (curated
  suggestions) for each city.
- **Plan & Bookings tab** — where you and Alyssa log real bookings (flights,
  lodging, trains/car, activities, dining). Each entry has a status:
  *Idea → Considering → Booked*.

## Turning on live sync (so you BOTH see each other's entries)

Right now the app saves bookings **on each device only** (browser
localStorage). To make it sync live between you and Alyssa, connect a free
Firebase project. It takes about 5 minutes, one time.

1. Go to <https://console.firebase.google.com> and **Add project** (any name,
   e.g. `spain-2026`). You can skip Google Analytics.
2. In the project, open **Build → Firestore Database → Create database**.
   Start in **production mode**, pick a region, and create it.
3. Open the **Rules** tab and paste the rules below, then **Publish**. These
   require an authenticated request, which the app provides via anonymous
   sign-in — so the data isn't openly writable by anyone who finds the project.
4. Turn on anonymous sign-in: **Build → Authentication → Get started →
   Sign-in method → Anonymous → Enable**.
4. Click the **gear ⚙ → Project settings**. Under **Your apps**, click the
   web icon `</>`, register an app (no hosting needed). Firebase shows you a
   `firebaseConfig` object.
5. Copy those values into the `FIREBASE_CONFIG` block near the bottom of
   `index.html` (search for `FIREBASE_CONFIG`). You only need
   `apiKey`, `authDomain`, `projectId`, and `appId`.
6. Copy the same block into `spain-itinerary.html` (or just delete that file
   and keep `index.html`).
7. Commit and push. Reload the site — the banner on the Plan tab should turn
   green: **"Live sync is on."**

### Firestore rules

These require an authenticated (anonymous) request, which the app handles
automatically:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Passwords

- **Family password** (to open the site): `coconut`. It's checked client-side
  as a SHA-256 hash, so it's not sitting in plain text in the page — but a
  determined person reading the code could still bypass a client-side gate.
  It keeps casual visitors out; the real data protection is the Firestore
  rules above. To change it, run `echo -n "newpassword" | shasum -a 256` and
  replace `PASS_HASH` in both HTML files.
- This password is separate from your Firebase login.

## Adding bookings from emails & screenshots

A static web page can't receive emails on its own, so here are the two
practical ways to get a confirmation email or screenshot turned into a logged
booking. Both run through me (Claude) as the "concierge" who reads the
confirmation and enters the details.

**Option A — paste it in chat (zero setup):** Alyssa forwards the email or
screenshot to Kyle, Kyle drops it (text, a screenshot, or a PDF) into the
Claude Code chat, and I extract the airline/hotel/dates/confirmation and add
it to the itinerary. Fastest to start today.

**Option B — shared Google Drive folder (best for Alyssa to self-serve):**
The folder already exists: **Spain 2026 Bookings**
<https://drive.google.com/drive/folders/1XIbsGonqKziJfbSFFLbQ9i0cF5h6x6wd>
(it has a short READ ME inside).
1. Share it with Alyssa (right-click → Share → add her email).
2. Either of you drops confirmation PDFs/screenshots into it — no renaming
   or organizing needed.
3. In a Claude session, say "check the Spain folder." I read the new files,
   extract the details, log them on the Plan & Bookings page, and fold the
   relevant ones into the day-by-day itinerary, then push the update.

How this connects to the data: items I log from the folder are written into
`CONFIRMED_BOOKINGS` in the HTML (baked into the site, always visible to both
of you on reload). The on-page form + Firebase are for quick self-entry on top
of those. So the folder works whether or not you finish the Firebase setup.

Either way: I add the confirmed item to the `Plan & Bookings` data and, when it
affects a specific day (a hotel check-in, a flight, a timed ticket), I drop it
into that day's card so the itinerary stays the single source of truth.

## Notes

- Bookings keys are public (that's normal for Firebase web apps) — security
  comes from the Firestore rules, not from hiding the config.
- The two HTML files must carry the same `FIREBASE_CONFIG` to share data.

## AI Concierge (optional)

The **Concierge** tab is a chat you can ask anything about the trip — "lunch
near our Airbnb with good wine", "what should we do on a rainy afternoon in
Madrid", "is the Sevilla day too packed?". It runs on Claude and already knows
your itinerary and bookings. So the API key is never exposed in this public
page, the page talks to a tiny proxy you host (a free Cloudflare Worker); the
proxy holds the key and checks the family password before calling Claude.

**One-time setup (~15 min):**

1. **Get an Anthropic API key** at <https://console.anthropic.com> → API Keys.
   In **Billing → Limits**, set a low monthly spend cap — this is your real
   protection, since the Worker URL lives in this public repo.
2. **Create the Worker.** Easiest path: Cloudflare dashboard → **Workers &
   Pages → Create → Worker**, name it (e.g. `spain-concierge`), **Deploy**,
   then **Edit code** and paste the contents of `concierge-worker.js` (in this
   repo). Deploy again. (CLI alternative: `npm i -g wrangler`, then
   `wrangler deploy concierge-worker.js`.)
3. **Add secrets** to the Worker (Settings → Variables and Secrets, "Encrypt"):
   - `ANTHROPIC_API_KEY` — your key from step 1.
   - `APP_PASSWORD` — the family password (`coconut` unless you changed it).
   - `MODEL` *(optional)* — defaults to `claude-sonnet-4-6`; set it to
     `claude-opus-4-8` for the most capable (and pricier) answers.
4. **Wire it up.** Copy the Worker URL (e.g.
   `https://spain-concierge.<you>.workers.dev`) into `CONCIERGE_ENDPOINT` near
   the top of the script in **`index.html`** *and* **`spain-itinerary.html`**,
   then commit and push.
5. Open the site → **Concierge** tab and ask away. (You'll enter the family
   password once per session so the chat can authenticate to the Worker.)

**Security note:** because this is a public site/repo, the Worker URL and the
family password aren't truly secret. The spend cap from step 1 is what stops
runaway cost; the password check just deters casual drive-by use. To rotate
access later, change `APP_PASSWORD` on the Worker (and the site password).
</content>
</invoke>
