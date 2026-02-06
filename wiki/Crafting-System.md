# Crafting System

This page explains how the Minecraft crafting verification system works.

## Crafting Recipes

Minecraft CAPTCHA uses a subset of real Minecraft crafting recipes as challenges. Each recipe defines a pattern of materials placed on a 3x3 grid that produces a specific output item.

### Recipe Types

#### Shaped Recipes

Shaped recipes require items to be placed in a specific pattern. The position of each item matters.

**Example — Wooden Pickaxe:**

```
[ plank ] [ plank ] [ plank ]
[       ] [ stick ] [       ]
[       ] [ stick ] [       ]
```

Output: Wooden Pickaxe

#### Shapeless Recipes

Shapeless recipes only require the correct items to be present anywhere on the grid. Position does not matter.

**Example — Mushroom Stew:**

```
Items needed: red mushroom, brown mushroom, bowl
Place them in any slots on the grid.
```

Output: Mushroom Stew

## Recipe Data Format

Recipes are stored as JSON objects:

```json
{
  "id": "wooden_pickaxe",
  "type": "shaped",
  "pattern": [
    ["plank", "plank", "plank"],
    [null,    "stick", null],
    [null,    "stick", null]
  ],
  "output": "wooden_pickaxe",
  "materials": ["plank", "stick"],
  "difficulty": "easy"
}
```

```json
{
  "id": "mushroom_stew",
  "type": "shapeless",
  "ingredients": ["red_mushroom", "brown_mushroom", "bowl"],
  "output": "mushroom_stew",
  "difficulty": "easy"
}
```

## Challenge Generation

When a new CAPTCHA is requested, the server:

1. **Selects a recipe** at random (optionally filtered by difficulty)
2. **Prepares materials** — the required items plus a few decoy items to increase difficulty
3. **Creates a challenge token** — a signed, time-limited identifier linking this session to the expected recipe
4. **Returns the challenge** — target item name, available materials, and challenge ID

## Validation

When the user submits their crafting grid:

1. **Retrieve the challenge** using the submitted `challengeId`
2. **Check expiration** — reject if the challenge has timed out
3. **Compare the grid** to the expected recipe pattern:
   - For **shaped** recipes: exact positional match (with optional offset handling)
   - For **shapeless** recipes: check that all required ingredients are present
4. **Return result** — success (with verification cookie) or failure

### Offset Handling for Shaped Recipes

Like real Minecraft, shaped recipes can be placed anywhere on the grid as long as the relative positions are preserved. For example, a 2x2 recipe can be placed in any of the four corners of the 3x3 grid.

```
Valid placements for a 2x2 recipe:

Top-left:        Top-right:       Bottom-left:     Bottom-right:
[A][B][ ]        [ ][A][B]        [ ][ ][ ]        [ ][ ][ ]
[C][D][ ]        [ ][C][D]        [A][B][ ]        [ ][A][B]
[ ][ ][ ]        [ ][ ][ ]        [C][D][ ]        [ ][C][D]
```

## Difficulty Levels

| Level  | Description |
|--------|-------------|
| Easy   | Common recipes with few materials (2-3 items), no decoys |
| Medium | Moderately known recipes, 1-2 decoy materials added |
| Hard   | Obscure recipes, multiple decoys, shorter time limit |

Difficulty can be configured per-integration to balance security and user experience.

## Item Sprites

Each item is rendered using a sprite sheet of Minecraft item textures. Items are referenced by ID (e.g., `stick`, `plank`, `iron_ingot`) and mapped to their sprite coordinates at render time.
