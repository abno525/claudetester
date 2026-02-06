# API Reference

This page documents the Minecraft CAPTCHA REST API endpoints.

## Base URL

```
https://your-captcha-server.com/api
```

---

## Endpoints

### POST /challenge

Create a new CAPTCHA challenge.

**Request:**

```json
{
  "siteKey": "your-site-key",
  "difficulty": "medium"
}
```

| Field        | Type   | Required | Description                                    |
| ------------ | ------ | -------- | ---------------------------------------------- |
| `siteKey`    | string | yes      | Your public site key                           |
| `difficulty` | string | no       | `easy`, `medium`, or `hard`. Default: `medium` |

**Response (200):**

```json
{
  "challengeId": "ch_abc123def456",
  "targetItem": "wooden_pickaxe",
  "targetItemLabel": "Wooden Pickaxe",
  "materials": [
    { "id": "plank", "label": "Plank", "count": 3 },
    { "id": "stick", "label": "Stick", "count": 2 },
    { "id": "cobblestone", "label": "Cobblestone", "count": 2 }
  ],
  "gridSize": 3,
  "expiresAt": "2026-01-15T12:05:00Z"
}
```

| Field             | Type   | Description                           |
| ----------------- | ------ | ------------------------------------- |
| `challengeId`     | string | Unique challenge identifier           |
| `targetItem`      | string | Item ID the user must craft           |
| `targetItemLabel` | string | Human-readable item name              |
| `materials`       | array  | Available materials (includes decoys) |
| `gridSize`        | number | Grid dimension (always 3 for now)     |
| `expiresAt`       | string | ISO 8601 expiration timestamp         |

---

### POST /verify

Verify a user's crafting attempt.

**Request:**

```json
{
  "challengeId": "ch_abc123def456",
  "grid": [
    ["plank", "plank", "plank"],
    [null, "stick", null],
    [null, "stick", null]
  ],
  "secret": "your-secret-key"
}
```

| Field         | Type   | Required | Description                                     |
| ------------- | ------ | -------- | ----------------------------------------------- |
| `challengeId` | string | yes      | The challenge ID from `/challenge`              |
| `grid`        | array  | yes      | 3x3 array of item IDs or `null` for empty slots |
| `secret`      | string | yes      | Your secret key (server-side only)              |

**Response — Success (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response — Failure (200):**

```json
{
  "success": false,
  "error": "incorrect_recipe",
  "retriesRemaining": 2
}
```

**Response — Expired (410):**

```json
{
  "success": false,
  "error": "challenge_expired"
}
```

| Field              | Type    | Description                                      |
| ------------------ | ------- | ------------------------------------------------ |
| `success`          | boolean | Whether the crafting was correct                 |
| `token`            | string  | Verification token (only on success)             |
| `error`            | string  | Error code (only on failure)                     |
| `retriesRemaining` | number  | Attempts left before a new challenge is required |

---

### POST /validate-token

Validate a verification token server-side. Use this to confirm a user's token is legitimate before granting access.

**Request:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "secret": "your-secret-key"
}
```

**Response (200):**

```json
{
  "valid": true,
  "challengeId": "ch_abc123def456",
  "solvedAt": "2026-01-15T12:03:45Z"
}
```

**Response (200) — Invalid:**

```json
{
  "valid": false,
  "reason": "token_expired"
}
```

---

## Error Codes

| Code                  | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `incorrect_recipe`    | The submitted grid does not match the expected recipe |
| `challenge_expired`   | The challenge has timed out                           |
| `challenge_not_found` | The challenge ID is invalid or already consumed       |
| `rate_limited`        | Too many attempts; wait before retrying               |
| `invalid_site_key`    | The provided site key is not recognized               |
| `invalid_secret`      | The provided secret key is incorrect                  |
| `token_expired`       | The verification token has expired                    |
| `token_invalid`       | The verification token signature is invalid           |

## Rate Limits

| Endpoint               | Limit                               |
| ---------------------- | ----------------------------------- |
| `POST /challenge`      | 10 requests per minute per IP       |
| `POST /verify`         | 5 requests per minute per challenge |
| `POST /validate-token` | 30 requests per minute per secret   |

When rate-limited, the API returns HTTP 429 with a `Retry-After` header.

## Authentication

- **Client-side** requests use the public `siteKey`
- **Server-side** requests use the `secret` key
- Never expose your `secret` key in client-side code
