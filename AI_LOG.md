# AI Usage Log (`AI_LOG.md`)

This log documents how AI tools (Antigravity / Cursor) were used during development, what suggestions were generated, and what decisions were made.

---

### Entry 1: URL Validation
- **Tool:** Antigravity
- **Prompt:** "Generate regex to validate URLs in Express."
- **AI Output:** A complex 100+ character regular expression to validate web addresses.
- **Decision:** Rejected regex approach due to edge cases and ReDoS risks. Used Node's native WHATWG `new URL()` parser to strictly validate protocols (`http:` / `https:`), hostname presence, and capped maximum length to 2048 characters.

---

### Entry 2: Short Code Generation
- **Tool:** Antigravity
- **Prompt:** "How to generate unique 6-char random short codes in Node.js for url shortner?"
- **AI Output:** Suggested `Math.random().toString(36).substring(2, 8)`.
- **Decision:** Replaced `Math.random()` with cryptographically secure `crypto.randomBytes()`. Implemented a 62-character Base62 alphabet (`[0-9a-zA-Z]`) and added a 5-attempt retry loop on database insert to handle code collisions.

---

### Entry 3: Database & Schema Design
- **Tool:** Antigravity
- **Prompt:** "Create Mongoose schema for URL shortener."
- **AI Output:** Suggested a schema with embedded subdocuments for user analytics and complex hooks.
- **Decision:** Kept the model lightweight and direct: `shortCode` (with unique index), `originalUrl`, `clicks`, `lastAccessedAt`, and `timestamps`.

---

### Entry 4: Atomic Click Tracking & Race Conditions
- **Tool:** Cursor
- **Prompt:** "How to increment click count on redirect route?"
- **AI Output:** Suggested `findOne()`, incrementing `doc.clicks++` in memory, and running `await doc.save()`.
- **Decision:** Replaced read-modify-write with MongoDB's atomic operator: `Url.findOneAndUpdate({ shortCode }, { $inc: { clicks: 1 }, lastAccessedAt: new Date() }, { returnDocument: 'after' })` to prevent race conditions under concurrent visits.

---

### Entry 5: 404 Behavior on Missing Links
- **Tool:** Antigravity
- **Prompt:** "Return 404 for non-existent short codes in GET /:code."
- **AI Output:** `res.status(404).json({ error: 'Short link not found' })`.
- **Decision:** Implemented content negotiation (`req.accepts('html')`). Browser visitors get a styled `404.html` page, while API requests receive JSON.

---

### Entry 6: UI State & Reload Persistence
- **Tool:** Cursor
- **Prompt:** "Build a single page form to shorten URLs and copy links and make minimal UI."
- **AI Output:** Basic form with an alert on copy and disappearing results on page refresh.
- **Decision:** Replaced alert with smooth in-place "Copied!" button feedback. Added `localStorage` tracking and a "Your Shortened Links" list with real-time stats refresh so user-generated links persist across browser reloads.
