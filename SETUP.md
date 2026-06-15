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
3. Open the **Rules** tab and paste the rules below, then **Publish**. This
   keeps the data private to a simple shared password you both type once.
   (For a quick start you can instead use the "test mode" rules Firebase
   offers, but they expire in 30 days — the rules below don't.)
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

### Suggested Firestore rules

These allow anyone who knows the project to read/write the `bookings`
collection. For a private family trip that's usually fine (the config keys are
public by design). If you want a light lock, keep the project name obscure and
don't share the URL widely:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{doc} {
      allow read, write: if true;
    }
  }
}
```

If you'd prefer real password protection, tell me and I'll wire up Firebase
Anonymous Auth + a shared passphrase gate.

## Notes

- Bookings keys are public (that's normal for Firebase web apps) — security
  comes from the Firestore rules, not from hiding the config.
- The two HTML files must carry the same `FIREBASE_CONFIG` to share data.
</content>
</invoke>
