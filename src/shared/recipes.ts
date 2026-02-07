import type { Recipe } from "./types.js";

/**
 * Built-in set of Minecraft crafting recipes used for captcha challenges.
 * Each recipe mirrors the vanilla Minecraft crafting grid layout.
 */
export const RECIPES: Recipe[] = [
  {
    id: "wooden_pickaxe",
    result: "wooden_pickaxe",
    resultName: "Wooden Pickaxe",
    count: 1,
    pattern: [
      ["oak_planks", "oak_planks", "oak_planks"],
      [null, "stick", null],
      [null, "stick", null],
    ],
  },
  {
    id: "wooden_sword",
    result: "wooden_sword",
    resultName: "Wooden Sword",
    count: 1,
    pattern: [
      [null, "oak_planks", null],
      [null, "oak_planks", null],
      [null, "stick", null],
    ],
  },
  {
    id: "crafting_table",
    result: "crafting_table",
    resultName: "Crafting Table",
    count: 1,
    pattern: [
      ["oak_planks", "oak_planks", null],
      ["oak_planks", "oak_planks", null],
      [null, null, null],
    ],
  },
  {
    id: "sticks",
    result: "stick",
    resultName: "Sticks",
    count: 4,
    pattern: [
      [null, "oak_planks", null],
      [null, "oak_planks", null],
      [null, null, null],
    ],
  },
  {
    id: "torch",
    result: "torch",
    resultName: "Torch",
    count: 4,
    pattern: [
      [null, "coal", null],
      [null, "stick", null],
      [null, null, null],
    ],
  },
  {
    id: "wooden_shovel",
    result: "wooden_shovel",
    resultName: "Wooden Shovel",
    count: 1,
    pattern: [
      [null, "oak_planks", null],
      [null, "stick", null],
      [null, "stick", null],
    ],
  },
  {
    id: "chest",
    result: "chest",
    resultName: "Chest",
    count: 1,
    pattern: [
      ["oak_planks", "oak_planks", "oak_planks"],
      ["oak_planks", null, "oak_planks"],
      ["oak_planks", "oak_planks", "oak_planks"],
    ],
  },
  {
    id: "furnace",
    result: "furnace",
    resultName: "Furnace",
    count: 1,
    pattern: [
      ["cobblestone", "cobblestone", "cobblestone"],
      ["cobblestone", null, "cobblestone"],
      ["cobblestone", "cobblestone", "cobblestone"],
    ],
  },
  // --- Multi-material recipes below ---
  {
    id: "iron_pickaxe",
    result: "iron_pickaxe",
    resultName: "Iron Pickaxe",
    count: 1,
    pattern: [
      ["iron_ingot", "iron_ingot", "iron_ingot"],
      [null, "stick", null],
      [null, "stick", null],
    ],
  },
  {
    id: "diamond_sword",
    result: "diamond_sword",
    resultName: "Diamond Sword",
    count: 1,
    pattern: [
      [null, "diamond", null],
      [null, "diamond", null],
      [null, "stick", null],
    ],
  },
  {
    id: "bow",
    result: "bow",
    resultName: "Bow",
    count: 1,
    pattern: [
      [null, "stick", "string"],
      ["stick", null, "string"],
      [null, "stick", "string"],
    ],
  },
  {
    id: "fishing_rod",
    result: "fishing_rod",
    resultName: "Fishing Rod",
    count: 1,
    pattern: [
      [null, null, "stick"],
      [null, "stick", "string"],
      ["stick", null, "string"],
    ],
  },
  {
    id: "bookshelf",
    result: "bookshelf",
    resultName: "Bookshelf",
    count: 1,
    pattern: [
      ["oak_planks", "oak_planks", "oak_planks"],
      ["book", "book", "book"],
      ["oak_planks", "oak_planks", "oak_planks"],
    ],
  },
  {
    id: "iron_helmet",
    result: "iron_helmet",
    resultName: "Iron Helmet",
    count: 1,
    pattern: [
      ["iron_ingot", "iron_ingot", "iron_ingot"],
      ["iron_ingot", null, "iron_ingot"],
      [null, null, null],
    ],
  },
  {
    id: "ladder",
    result: "ladder",
    resultName: "Ladder",
    count: 3,
    pattern: [
      ["stick", null, "stick"],
      ["stick", "stick", "stick"],
      ["stick", null, "stick"],
    ],
  },
  {
    id: "stone_stairs",
    result: "stone_stairs",
    resultName: "Stone Stairs",
    count: 4,
    pattern: [
      ["stone", null, null],
      ["stone", "stone", null],
      ["stone", "stone", "stone"],
    ],
  },
  {
    id: "piston",
    result: "piston",
    resultName: "Piston",
    count: 1,
    pattern: [
      ["oak_planks", "oak_planks", "oak_planks"],
      ["cobblestone", "iron_ingot", "cobblestone"],
      ["cobblestone", "redstone", "cobblestone"],
    ],
  },
  {
    id: "golden_apple",
    result: "golden_apple",
    resultName: "Golden Apple",
    count: 1,
    pattern: [
      ["gold_ingot", "gold_ingot", "gold_ingot"],
      ["gold_ingot", "apple", "gold_ingot"],
      ["gold_ingot", "gold_ingot", "gold_ingot"],
    ],
  },
];
