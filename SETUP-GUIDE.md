# Complete Setup Guide — IPL Landing Page with Meta Pixel + CAPI

## Project Overview
Single HTML landing page for Meta (Facebook) ads campaigns.
- Drives traffic to a Telegram group
- Tracks visitors with Meta Pixel (browser) + Conversions API (server-side)
- Hosted free on Netlify with GitHub auto-deploy
- No WordPress, no paid plugins — total cost ₹0

---

## Project Structure

```
vishal_landing_page/
  index.html                  ← entire landing page (HTML + CSS + JS)
  ipl-players.webp            ← hero image (WebP format, under 700KB)
  netlify.toml                ← Netlify build config
  netlify/
    functions/
      capi.js                 ← Meta CAPI serverless function
  .gitignore
  SETUP-GUIDE.md              ← this file
  wordpress-setup-guide.md    ← alternative WordPress instructions
```

---

## STEP 1 — Replace Placeholders in index.html

Open `index.html` and press `Ctrl+H` (Find & Replace).

### 1A — Meta Pixel ID
- Find:    `YOUR_PIXEL_ID`
- Replace: your actual Pixel ID (e.g. `1234567890123456`)
- Click **Replace All** — appears in **2 places**

### 1B — Telegram Link
- Find:    `https://t.me/YOUR_TELEGRAM_GROUP`
- Replace: your actual Telegram link
  - Public channel → `https://t.me/yourchannelname`
  - Private invite → `https://t.me/+AbCdEfGhIjKl1234`

### 1C — Hero Image
- Save your image as `ipl-players.webp` in the project folder
- Image should be **WebP format, under 700KB**
- To compress: go to **squoosh.app** → upload image → choose WebP → quality 80 → download

---

## STEP 2 — Create Your Meta Pixel & Get the Pixel ID

> If you already have a Pixel created, skip to **2E** to just copy the ID.

### 2A — Go to Events Manager
1. Open **business.facebook.com** in your browser
2. Make sure you are logged into the correct Facebook account (the one connected to your Ad Account)
3. Click the **9-dot grid icon** (top left corner, looks like a waffle)
4. In the dropdown menu, click **"Events Manager"**

### 2B — Start Creating a Pixel
1. In Events Manager, click the **green "+ Connect Data Sources"** button (left sidebar)
2. A popup appears — select **"Web"**
3. Click **"Connect"**

### 2C — Choose Pixel as Your Connection Method
1. Next screen asks "How do you want to connect your website?"
2. Select **"Meta Pixel"**
3. Click **"Connect"**

### 2D — Name Your Pixel
1. Enter a name — e.g. `IPL Landing Page` or `Vishal Cricket Ads`
2. In the "Website URL" field — enter your Netlify URL (e.g. `https://amazing-fox-123.netlify.app`)
   - If you don't have it yet, leave it blank — you can add it later
3. Click **"Create Pixel"**

### 2E — Copy Your Pixel ID
1. After creation, you land on the pixel setup screen
2. At the very top, you will see a number like `1234567890123456` (15-16 digits)
3. That number is your **Pixel ID**
4. **Click on it to copy**, or manually select and copy it
5. Paste it into Notepad — you will need it in Step 1 and Step 6

> **Where to find it later:** Events Manager → click your pixel name in the left sidebar → the ID appears at the top of the page under the pixel name

### 2F — Skip the Automatic Install
1. Meta will ask you to install the pixel — choose **"Install code manually"**
2. You will see the pixel base code — **ignore this**, our `index.html` already has it
3. Click **"Continue"** or close — you're done here

---

## STEP 3 — Get Your Access Token (for CAPI)

> This token lets the server-side function send data to Meta securely.
> There are **two ways** to get this token. Use **Method A (System User)** — it is more robust and recommended for production.

---

### METHOD A — System User Token ⭐ Recommended

A System User is a bot account inside Meta Business Manager. It is not a real person — it is a dedicated API identity. Its token does not break if your personal account is logged out, banned, or has password issues.

#### 3A — Go to Business Settings
1. Go to **business.facebook.com**
2. Click the **gear icon ⚙️** (bottom left corner)
3. This opens **Business Settings**

#### 3B — Create a System User
1. In the left sidebar, scroll down to **"Users"** → click **"System Users"**
2. Click the **"Add"** button
3. Fill in:
   - **System Username:** `capi-bot` (any name works)
   - **System User Role:** select **Standard**
4. Click **"Create System User"**
5. The new user `capi-bot` now appears in the list

#### 3C — Give the System User Access to Your Pixel
1. In the left sidebar, scroll down to **"Data Sources"** → click **"Pixels"**
2. Click on your pixel name (e.g. `IPL Landing Page`)
3. Click **"Add People"** button (top right)
4. In the dropdown, select **`capi-bot`**
5. Set permission to **"Manage"**
6. Click **"Save Changes"**

#### 3D — Generate the Token
1. Go back to left sidebar → **"Users"** → **"System Users"**
2. Click on **`capi-bot`** in the list
3. Click **"Generate New Token"** button (top right)
4. Select your **Ad Account** from the dropdown
5. Check these permissions:
   - ✅ `ads_management`
   - ✅ `ads_read`
   - ✅ `pages_read_engagement`
6. Click **"Generate Token"**
7. A popup shows the token — starts with **`EAABx...`**
8. **Copy it immediately and paste into Notepad** — it is shown only once
9. If you lose it, just generate a new one from the same screen

> **Advantage:** This token lasts much longer and does not depend on your personal account being active.

---

### METHOD B — Events Manager Token (Quick & Simple)

Use this if you want to get started fast, or if you are just testing. The token is tied to your personal Facebook account so if your account has any issues, the token may break.

#### 3E — Go to Your Pixel Settings
1. Go to **business.facebook.com** → 9-dot menu → **Events Manager**
2. In the left sidebar, click on your pixel name (e.g. `IPL Landing Page`)
3. Click the **"Settings"** tab (in the top tab bar)

#### 3F — Generate the Token
1. Scroll down to the **"Conversions API"** section
2. Click **"Generate access token"**
3. A popup shows the token — starts with **`EAABx...`**
4. Click **"Copy"** and paste into Notepad

> **Token expires after ~60 days.** If CAPI stops working, come back here and generate a new token → update it in Netlify env vars → redeploy.

---

### 3G — Save Both Values
Whichever method you used, by now you should have saved in Notepad:
```
Pixel ID:     1234567890123456
Access Token: EAABxyz123ABCdef...
```
You will paste these into Netlify in Step 6.

---

## STEP 4 — Push to GitHub

### 4A — First time setup
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 4B — Every update after that
```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## STEP 5 — Deploy to Netlify

### 5A — Create Netlify account
1. Go to **netlify.com** → Sign up free (use Google)

### 5B — First deploy (drag and drop)
1. After login you see a big drop area
2. Drag your entire project folder into it
3. Wait 30 seconds → you get a URL like `https://amazing-fox-123.netlify.app`

### 5C — Connect GitHub for auto-deploy (do this once)
1. Netlify dashboard → your site
2. **Site configuration** → **Build & deploy** → **Continuous deployment**
3. Click **"Link to Git provider"** → **GitHub**
4. Authorize Netlify → select your repo
5. Branch: **main** → click **Deploy site**

After this, every `git push` triggers an automatic redeploy in ~30 seconds.

---

## STEP 6 — Add Environment Variables to Netlify

This is what makes the CAPI server function work.

1. Netlify dashboard → your site
2. **Site configuration** → **Environment variables**
3. Click **Add a variable** — add these two:

| Key | Value |
|---|---|
| `META_PIXEL_ID` | Your 15-16 digit Pixel ID |
| `META_ACCESS_TOKEN` | Your `EAABx...` access token |

4. Click **Save**
5. Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## STEP 7 — Test Everything

### 7A — Test Browser Pixel
1. **business.facebook.com** → Events Manager → your pixel
2. Click **"Test Events"** tab
3. Paste your Netlify URL → click **"Open Website"**
4. Your page opens in a new tab
5. Back in Events Manager → you should see `PageView` appear ✅
6. Click JOIN TELEGRAM button → `Lead` appears ✅

### 7B — Test CAPI (Server Events)
1. Same **Test Events** tab
2. Toggle from **"Browser Events"** to **"Server Events"**
3. Reload your page
4. `PageView` appears here too (came from Netlify Function) ✅
5. Click button → `Lead` appears in server events ✅

### 7C — Confirm Deduplication
1. Events Manager → **Overview** tab
2. Both `PageView` and `Lead` are counted **once** not twice ✅
3. This means browser pixel + CAPI are working together correctly

---

## STEP 8 — Final Checklist Before Running Ads

```
□ index.html — YOUR_PIXEL_ID replaced (2 places)
□ index.html — YOUR_TELEGRAM_GROUP replaced with real link
□ ipl-players.webp — image in project folder, under 700KB
□ GitHub — all files pushed (git push)
□ Netlify — site is live and loading correctly
□ Netlify — META_PIXEL_ID environment variable set
□ Netlify — META_ACCESS_TOKEN environment variable set
□ Netlify — redeployed after adding env variables
□ Meta Events Manager — PageView fires on page load
□ Meta Events Manager — Lead fires on button click
□ Server Events tab — both events appear there too
□ Tested on real mobile phone — layout looks correct
□ JOIN TELEGRAM button — opens correct Telegram link
```

---

## How It Works (Technical Summary)

```
User visits page
    │
    ├─► Browser Pixel fires PageView (client-side)
    │     fbq('track', 'PageView', {}, { eventID: 'uuid-123' })
    │
    └─► Netlify Function fires PageView (server-side)
          POST /.netlify/functions/capi
          → Sends to Meta Graph API with same eventID 'uuid-123'
          → Meta deduplicates: counts as 1 event, not 2

User clicks JOIN TELEGRAM
    │
    ├─► Browser Pixel fires Lead (client-side)
    │     fbq('track', 'Lead', {...}, { eventID: 'uuid-456' })
    │
    └─► Netlify Function fires Lead (server-side)
          → Same eventID 'uuid-456' → deduplicated
          → Includes: IP address, User Agent, fbp/fbc cookies
```

**Result: ~90-95% of all visitors tracked** (vs ~60-65% browser-only)

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `ipl-players.webp 404` | Image not pushed to GitHub / Netlify not redeployed | `git add ipl-players.webp && git push` then redeploy |
| `Invalid PixelID: null` | `YOUR_PIXEL_ID` placeholder not replaced | Find & Replace in index.html → push |
| `CAPI 500 error` | Env variables not set in Netlify | Add `META_PIXEL_ID` + `META_ACCESS_TOKEN` in Netlify env vars |
| `SVG path error` | Broken SVG path in Telegram icon | Already fixed in current code |
| Image loads slowly | Image too large (over 1MB) | Compress at squoosh.app → WebP format → 80% quality |
| Netlify not redeploying | GitHub not connected | Link GitHub in Site config → Build & deploy |
| Token expired | Access tokens expire after ~60 days | Regenerate in Meta Business Manager → System Users |

---

## Making Updates After Launch

### Change the Telegram link
```bash
# Edit index.html → update the href on the button
git add index.html
git commit -m "update telegram link"
git push
# Netlify redeploys in 30 seconds
```

### Change the image
```bash
# Replace ipl-players.webp with new image (same filename)
git add ipl-players.webp
git commit -m "update hero image"
git push
```

### Change the text/headline
```bash
# Edit index.html → find the <h1 class="headline"> section
git add index.html
git commit -m "update headline text"
git push
```

---

## Tracking Quality Comparison

| Setup | Coverage | Cost |
|---|---|---|
| Browser Pixel only | ~60-65% | ₹0 |
| **Browser Pixel + Netlify CAPI** | **~90-95%** | **₹0** |
| WordPress + PixelYourSite Pro | ~90-95% | ~₹10,000/year |

---

## Key URLs

| Service | URL |
|---|---|
| Your live site | `https://glistening-biscotti-d3f417.netlify.app` |
| GitHub repo | `https://github.com/vishaldreameleven-ops/metaPixelAds` |
| Netlify dashboard | `https://app.netlify.com` |
| Meta Events Manager | `https://business.facebook.com/events_manager` |
| Meta Business Settings | `https://business.facebook.com/settings` |
| Image compressor | `https://squoosh.app` |
