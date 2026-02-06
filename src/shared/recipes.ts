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
];
