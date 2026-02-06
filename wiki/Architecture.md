# Architecture

This page describes the high-level architecture of Minecraft CAPTCHA.

## Overview

Minecraft CAPTCHA is a client-server system with three main components:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Frontend UI   │◄─────►│   Backend API   │◄─────►│  Recipe Store   │
│ (Crafting Table)│       │  (Verification)  │       │  (Item Data)    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Components

### 1. Frontend UI (Client)

The browser-side component that renders the crafting table interface.

**Responsibilities:**

- Render the 3x3 crafting grid
- Display available materials to the user
- Handle drag-and-drop of items into grid slots
- Show the target item the user must craft
- Send the completed grid layout to the backend for verification
- Display pass/fail feedback

**Key design goals:**

- Pixel-faithful Minecraft crafting table appearance
- Responsive — works on desktop and mobile
- Lightweight — minimal JavaScript bundle size
- Accessible — keyboard navigation support

### 2. Backend API (Server)

The server-side component that validates crafting attempts and issues verification tokens.

**Responsibilities:**

- Generate CAPTCHA challenges (select a recipe + provide materials)
- Validate submitted grid layouts against known recipes
- Issue signed verification cookies on success
- Rate-limit attempts to prevent brute-force solving

### 3. Recipe Store

A data layer containing Minecraft crafting recipes.

**Responsibilities:**

- Store recipe definitions (grid patterns mapped to output items)
- Provide recipe lookup for challenge generation
- Support both shaped and shapeless recipes

## Data Flow

```
1. Client requests a new CAPTCHA challenge
        │
        ▼
2. Server selects a random recipe, picks materials,
   and returns: { targetItem, availableMaterials, challengeId }
        │
        ▼
3. User arranges materials on the 3x3 crafting grid
        │
        ▼
4. Client submits: { challengeId, gridLayout[3][3] }
        │
        ▼
5. Server validates grid against the recipe
        │
        ├── Match    → Set signed verification cookie, return success
        └── No match → Return failure, allow retry
```

## Security Considerations

- **Challenge tokens** are server-generated and time-limited to prevent replay attacks
- **Verification cookies** are signed (HMAC) so they cannot be forged
- **Rate limiting** prevents automated brute-force attempts
- **Recipe obfuscation** — the server never sends the answer; it only confirms or denies
- **Grid validation** happens exclusively server-side; client state is untrusted

## Technology Decisions

Technology choices are still being finalized (see [todo.md](../todo.md)). The architecture is designed to be stack-agnostic — any web framework can implement these components as long as the [API contract](API-Reference.md) is followed.
