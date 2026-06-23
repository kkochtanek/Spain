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

**Setup — four steps, no coding:**

1. **Make a Claude key.** Sign in at <https://console.anthropic.com> →
   **API keys** → create one and copy it. Then in **Billing → Limits** set a
   small monthly cap so it can never run up a surprise bill.
2. **Put the helper online.** Go to <https://dash.cloudflare.com> → **Workers &
   Pages → Create → Worker → Deploy**. Click **Edit code**, delete what's
   there, paste in everything from `concierge-worker.js` (in this repo), and
   click **Deploy** again.
3. **Give it two passwords.** In that Worker → **Settings → Variables and
   Secrets**, add two secrets:
   - `ANTHROPIC_API_KEY` = the key from step 1
   - `APP_PASSWORD` = `coconut` (your site password)
4. **Connect it in the app.** Copy the Worker's address (it ends in
   `.workers.dev`). Open the site → **Concierge** tab, paste the address in the
   box, and press **Save**. Done — nothing to edit or push. You'll type the
   family password once to start chatting, and you can change the address later
   with the **Change Worker URL** link under the chat.

*Want the smartest answers?* Add one more secret in step 3,
`MODEL` = `claude-opus-4-8` (pricier). Otherwise it uses the fast, cheaper
`claude-sonnet-4-6`.

**Security note:** since this is a public site, the Worker address and family
password aren't truly secret — the spend cap from step 1 is what protects you
from runaway cost. To cut off access later, change `APP_PASSWORD` on the Worker.
</content>
</invoke>
