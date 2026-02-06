/** Color and display info for known Minecraft items */
export interface ItemDisplay {
  color: string;
  icon: string;
}

/**
 * Maps item IDs to their display properties.
 * Uses simple emoji/unicode icons and representative colors
 * so the widget works without external sprite sheets.
 */
export const ITEM_DISPLAY: Record<string, ItemDisplay> = {
  // Wood & building
  plank:          { color: "#b88a4a", icon: "\u25A3" },   // ▣
  log:            { color: "#6b4226", icon: "\u25A3" },
  stick:          { color: "#7a5c2e", icon: "\u2502" },   // │
  cobblestone:    { color: "#7f7f7f", icon: "\u25A7" },   // ▧
  stone:          { color: "#9a9a9a", icon: "\u25A1" },   // □
  sand:           { color: "#dbc67b", icon: "\u25A0" },
  glass:          { color: "#c8e8f0", icon: "\u25A1" },
  brick:          { color: "#9b4a2c", icon: "\u25A6" },   // ▦
  wool:           { color: "#e8e8e8", icon: "\u25A0" },

  // Ores & metals
  iron_ingot:     { color: "#d4d4d4", icon: "\u25C7" },   // ◇
  gold_ingot:     { color: "#f5d442", icon: "\u25C7" },
  diamond:        { color: "#5ce8d6", icon: "\u25C6" },   // ◆
  coal:           { color: "#2a2a2a", icon: "\u25C6" },
  redstone:       { color: "#c41a1a", icon: "\u25CF" },   // ●
  lapis_lazuli:   { color: "#2545a8", icon: "\u25CF" },
  emerald:        { color: "#17b83e", icon: "\u25C6" },

  // Food & organic
  wheat:          { color: "#c8a84e", icon: "\u2261" },   // ≡
  sugar:          { color: "#f0f0f0", icon: "\u25CB" },   // ○
  egg:            { color: "#f0e6c8", icon: "\u25CB" },
  milk_bucket:    { color: "#f8f8f8", icon: "\u25D5" },   // ◕
  cocoa_beans:    { color: "#5a3620", icon: "\u25CF" },
  red_mushroom:   { color: "#d42020", icon: "\u25D2" },   // ◒
  brown_mushroom: { color: "#8b6b4a", icon: "\u25D2" },
  bowl:           { color: "#7a5c2e", icon: "\u222A" },   // ∪
  apple:          { color: "#d43030", icon: "\u25CF" },
  melon_slice:    { color: "#40a828", icon: "\u25D0" },   // ◐
  pumpkin:        { color: "#d48820", icon: "\u25A0" },
  sugar_cane:     { color: "#60b830", icon: "\u2502" },
  bread:          { color: "#c8963a", icon: "\u25AC" },   // ▬
  cookie:         { color: "#c89848", icon: "\u25CB" },

  // Tools & weapons (output items)
  wooden_pickaxe:   { color: "#b88a4a", icon: "\u26CF" }, // ⛏
  stone_pickaxe:    { color: "#7f7f7f", icon: "\u26CF" },
  iron_pickaxe:     { color: "#d4d4d4", icon: "\u26CF" },
  gold_pickaxe:     { color: "#f5d442", icon: "\u26CF" },
  diamond_pickaxe:  { color: "#5ce8d6", icon: "\u26CF" },
  wooden_sword:     { color: "#b88a4a", icon: "\u2694" }, // ⚔
  stone_sword:      { color: "#7f7f7f", icon: "\u2694" },
  iron_sword:       { color: "#d4d4d4", icon: "\u2694" },
  gold_sword:       { color: "#f5d442", icon: "\u2694" },
  diamond_sword:    { color: "#5ce8d6", icon: "\u2694" },
  wooden_axe:       { color: "#b88a4a", icon: "\u{1FA93}" },
  stone_axe:        { color: "#7f7f7f", icon: "\u{1FA93}" },
  iron_axe:         { color: "#d4d4d4", icon: "\u{1FA93}" },
  wooden_shovel:    { color: "#b88a4a", icon: "\u2E15" },
  stone_shovel:     { color: "#7f7f7f", icon: "\u2E15" },
  iron_shovel:      { color: "#d4d4d4", icon: "\u2E15" },
  wooden_hoe:       { color: "#b88a4a", icon: "\u2020" }, // †
  stone_hoe:        { color: "#7f7f7f", icon: "\u2020" },

  // Armor
  iron_helmet:      { color: "#d4d4d4", icon: "\u2229" }, // ∩
  iron_chestplate:  { color: "#d4d4d4", icon: "\u25AD" }, // ▭
  iron_leggings:    { color: "#d4d4d4", icon: "\u2016" }, // ‖
  iron_boots:       { color: "#d4d4d4", icon: "\u2584" }, // ▄

  // Crafted items
  crafting_table:   { color: "#b88a4a", icon: "\u25A6" },
  furnace:          { color: "#7f7f7f", icon: "\u25A6" },
  chest:            { color: "#9a7a3a", icon: "\u25A3" },
  torch:            { color: "#f5c842", icon: "\u{1F525}" },
  ladder:           { color: "#7a5c2e", icon: "#" },
  door:             { color: "#b88a4a", icon: "\u25AF" },  // ▯
  fence:            { color: "#b88a4a", icon: "\u2225" },  // ∥
  bed:              { color: "#c41a1a", icon: "\u2583" },  // ▃
  paper:            { color: "#f0f0f0", icon: "\u25AD" },
  book:             { color: "#8b6b4a", icon: "\u25AE" },  // ▮
  leather:          { color: "#8b5a2b", icon: "\u25A0" },
  string:           { color: "#d0d0d0", icon: "~" },
  bow:              { color: "#7a5c2e", icon: ")" },
  arrow:            { color: "#7a5c2e", icon: "\u2191" },  // ↑
  bucket:           { color: "#b0b0b0", icon: "\u222A" },
  shears:           { color: "#d4d4d4", icon: "\u2702" },  // ✂
  cake:             { color: "#f0e0c0", icon: "\u25B3" },  // △
  mushroom_stew:    { color: "#a04030", icon: "\u222A" },
  piston:           { color: "#9a9a6a", icon: "\u25A4" },  // ▤
  compass:          { color: "#d4d4d4", icon: "\u25CE" },  // ◎
  clock:            { color: "#f5d442", icon: "\u25CE" },
  flint:            { color: "#484848", icon: "\u25C6" },
  feather:          { color: "#e0e0e0", icon: "/" },
  flint_and_steel:  { color: "#484848", icon: "\u2604" },  // ☄
  fishing_rod:      { color: "#7a5c2e", icon: "\u2308" },  // ⌈
};

/** Get display info for an item, with a fallback for unknown items */
export function getItemDisplay(itemId: string): ItemDisplay {
  return ITEM_DISPLAY[itemId] ?? { color: "#888888", icon: "?" };
}
