/**
 * Minecraft-style item visual mappings.
 * Maps item IDs to emoji/icon representations with styling info.
 */

export interface ItemVisual {
  /** Emoji or character to display */
  icon: string;
  /** Background color for the icon container */
  bg: string;
  /** Human-readable display name (for tooltip) */
  label: string;
}

const ITEM_VISUALS: Record<string, ItemVisual> = {
  oak_planks: { icon: "🪵", bg: "#b5884e", label: "Oak Planks" },
  stick: { icon: "🥢", bg: "#8b6914", label: "Stick" },
  coal: { icon: "⬛", bg: "#2a2a2a", label: "Coal" },
  cobblestone: { icon: "🪨", bg: "#7a7a7a", label: "Cobblestone" },
  iron_ingot: { icon: "⬜", bg: "#d4d4d4", label: "Iron Ingot" },
  gold_ingot: { icon: "🟨", bg: "#ffd700", label: "Gold Ingot" },
  diamond: { icon: "💎", bg: "#5ee8e4", label: "Diamond" },
  redstone: { icon: "🔴", bg: "#c41a1a", label: "Redstone" },
  string: { icon: "🧵", bg: "#e0e0e0", label: "String" },
  leather: { icon: "🟫", bg: "#8b5a2b", label: "Leather" },
  wooden_pickaxe: { icon: "⛏️", bg: "#b5884e", label: "Wooden Pickaxe" },
  wooden_sword: { icon: "🗡️", bg: "#b5884e", label: "Wooden Sword" },
  wooden_shovel: { icon: "🪏", bg: "#b5884e", label: "Wooden Shovel" },
  crafting_table: { icon: "🔨", bg: "#b5884e", label: "Crafting Table" },
  torch: { icon: "🔥", bg: "#ffa500", label: "Torch" },
  chest: { icon: "📦", bg: "#b5884e", label: "Chest" },
  furnace: { icon: "🔲", bg: "#7a7a7a", label: "Furnace" },
};

/** Default visual for unknown items */
const DEFAULT_VISUAL: ItemVisual = {
  icon: "❓",
  bg: "#555",
  label: "Unknown",
};

/** Get the visual representation for an item ID. */
export function getItemVisual(itemId: string): ItemVisual {
  return (
    ITEM_VISUALS[itemId] ?? {
      ...DEFAULT_VISUAL,
      label: itemId.replace(/_/g, " "),
    }
  );
}

/**
 * Create an icon element (span) for the given item ID.
 * The span contains the emoji, has a background color, and a title tooltip.
 */
export function createItemIcon(itemId: string): HTMLSpanElement {
  const visual = getItemVisual(itemId);
  const span = document.createElement("span");
  span.className = "mc-item-icon";
  span.textContent = visual.icon;
  span.title = visual.label;
  span.style.backgroundColor = visual.bg;
  return span;
}
