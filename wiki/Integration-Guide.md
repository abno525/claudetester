# Integration Guide

This guide explains how to embed Minecraft CAPTCHA into your web application.

## Overview

Minecraft CAPTCHA can be integrated into any web application using either:

1. **Drop-in widget** — a single `<script>` tag that renders the CAPTCHA
2. **API-only** — call the REST API directly and build your own UI

## Method 1: Drop-in Widget

### Step 1: Add the Script

Include the CAPTCHA script on your page:

```html
<script src="https://your-captcha-server.com/minecraft-captcha.js"></script>
```

### Step 2: Add the Container

Place a container element where you want the CAPTCHA to appear:

```html
<form action="/submit" method="POST">
  <!-- your form fields -->
  <div id="mc-captcha"></div>
  <button type="submit">Submit</button>
</form>
```

### Step 3: Initialize

```html
<script>
  MinecraftCaptcha.init({
    container: '#mc-captcha',
    siteKey: 'your-site-key',
    difficulty: 'medium',  // optional: easy | medium | hard
    theme: 'classic',      // optional: classic | dark
    onSuccess: function(token) {
      // token is automatically added to the form as a hidden field
      console.log('CAPTCHA passed');
    },
    onFailure: function() {
      console.log('CAPTCHA failed, user can retry');
    }
  });
</script>
```

### Step 4: Server-Side Verification

On your backend, verify the token included in the form submission:

```javascript
// Node.js example
const response = await fetch('https://your-captcha-server.com/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: req.body['mc-captcha-token'],
    secret: process.env.CAPTCHA_SECRET_KEY
  })
});

const result = await response.json();
if (result.success) {
  // proceed with form processing
} else {
  // reject the submission
}
```

## Method 2: API-Only

Use the REST API directly if you need full control over the UI. See the [API Reference](API-Reference.md) for endpoint details.

### Basic Flow

```javascript
// 1. Request a challenge
const challenge = await fetch('/api/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ difficulty: 'medium' })
}).then(r => r.json());

// challenge = { challengeId, targetItem, materials, expiresAt }

// 2. Build your own UI and collect the user's grid layout

// 3. Submit for verification
const result = await fetch('/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challengeId: challenge.challengeId,
    grid: [
      ['plank', 'plank', 'plank'],
      [null,    'stick', null],
      [null,    'stick', null]
    ]
  })
}).then(r => r.json());

// result = { success: true, token: '...' }
```

## Cookie-Based Verification

As an alternative to token-based verification, Minecraft CAPTCHA can set a signed cookie upon success. This is useful for scenarios where you want to gate access to an entire page or site section.

### How It Works

1. User completes the CAPTCHA
2. Server sets an `HttpOnly`, `Secure`, `SameSite=Strict` cookie: `mc_captcha_verified`
3. Subsequent requests from the user include this cookie
4. Your backend middleware checks for the cookie and validates its signature

### Middleware Example

```javascript
function requireCaptcha(req, res, next) {
  const cookie = req.cookies['mc_captcha_verified'];
  if (!cookie) {
    return res.redirect('/captcha');
  }

  const isValid = verifyCookieSignature(cookie, process.env.CAPTCHA_SECRET_KEY);
  if (!isValid) {
    return res.redirect('/captcha');
  }

  next();
}

app.get('/protected-page', requireCaptcha, (req, res) => {
  res.render('protected');
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string | required | CSS selector for the CAPTCHA container |
| `siteKey` | string | required | Your public site key |
| `difficulty` | string | `'medium'` | Challenge difficulty: `easy`, `medium`, `hard` |
| `theme` | string | `'classic'` | Visual theme: `classic`, `dark` |
| `locale` | string | `'en'` | Language for UI text |
| `timeout` | number | `300` | Challenge timeout in seconds |
| `onSuccess` | function | — | Callback on successful verification |
| `onFailure` | function | — | Callback on failed attempt |
| `onExpire` | function | — | Callback when challenge times out |
