# URL Shortener

A lightweight full stack URL shortener built with Node.js, Express, and MongoDB.

---

## 1. Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas (Mongoose)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Single-Page UI)
- **Testing:** Node.js native test runner (`node:test`) + `supertest`

**Why MongoDB:** Provides document storage with unique indexing on short codes and native atomic counter updates (`$inc`), ensuring data survives server restarts and handles concurrent visits safely.

---

## 2. Setup & Run (Under 2 Minutes)

### Prerequisites
- Node.js (v18+)
- npm

### Quick Start
```bash
npm install
npm start
```
Open `http://localhost:3000` in your browser.




## 3. Database Schema

```javascript
const urlSchema = new mongoose.Schema(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    originalUrl: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: null }
  },
  { timestamps: true }
);
```

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/shorten` | Creates a 6-character short code for a valid URL |
| `GET` | `/:code` | 302 Redirect to destination URL and increments click count |
| `GET` | `/api/stats/:code` | Returns click stats, creation date, and last accessed timestamp |
| `GET` | `/api/health` | Server uptime check |

---

## 5. What Works & What Is Out of Scope

### What Works
- **Strict Validation:** Rejects empty inputs, whitespace, malformed URLs, dangerous protocols (`javascript:`, `data:`), and inputs exceeding 2048 characters.
- **Short Code Generation:** 6-character Base62 string generated with `crypto.randomBytes` and a 5-attempt collision retry handler.
- **302 Redirection & Click Counting:** Atomic `$inc` updates in MongoDB on each redirect.
- **Data Persistence:** All URL data persists in MongoDB across server restarts.
- **404 Handling:** Styled HTML error page for browser visits; JSON error responses for API calls.



## 6. Next Steps (With 4 More Hours)

1. **Custom Vanity Slugs:** Allow users to choose custom short aliases with availability checks.
2. **Link Expiration (TTL):** MongoDB TTL index on an `expiresAt` field for automatic deletion.
3. **Analytics:** Capture referrers, device/browser types, and location data per click.
4. **Rate Limiting:** Add `express-rate-limit` on `/api/shorten` to prevent spam.
5. **QR Code Generator:** Instant QR code download for generated short links.

---

## Candidate Information
- **Name:** Pawan Suthar
- **Email:** sutharpawan1537@gmail.com
