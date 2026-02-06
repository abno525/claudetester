import type { ItemId } from "../shared/types.js";
import { getItemDisplay } from "../shared/items.js";

/**
 * Renders the available materials the user can drag onto the grid.
 * Items have unlimited supply — the user places as many as needed.
 */
export class MaterialsPanel {
  private el: HTMLElement;
  private materialEls: Map<string, HTMLElement> = new Map();
  private items: ItemId[] = [];

  /** Called when a material is selected (clicked for placement) */
  onMaterialSelected: ((itemId: string) => void) | null = null;

  constructor() {
    this.el = document.createElement("div");
  }

  getElement(): HTMLElement {
    return this.el;
  }

  /** Set the available materials and render them */
  setItems(items: ItemId[]): void {
    this.items = items;
    this.materialEls.clear();
    this.render();
  }

  /** Check if an element is a material tile */
  isMaterial(el: HTMLElement): boolean {
    return el.closest(".mc-captcha__material") !== null;
  }

  /** Get the item ID from a material element */
  getItemId(el: HTMLElement): string | null {
    const materialEl = el.closest(".mc-captcha__material") as HTMLElement;
    return materialEl?.dataset.itemId ?? null;
  }

  private render(): void {
    this.el.innerHTML = "";

    const label = document.createElement("div");
    label.className = "mc-captcha__materials-label";
    label.textContent = "Materials";
    this.el.appendChild(label);

    const container = document.createElement("div");
    container.className = "mc-captcha__materials";
    container.setAttribute("role", "list");
    container.setAttribute("aria-label", "Available materials");

    for (const itemId of this.items) {
      const tile = this.createMaterialTile(itemId);
      this.materialEls.set(itemId, tile);
      container.appendChild(tile);
    }

    this.el.appendChild(container);
  }

  private createMaterialTile(itemId: ItemId): HTMLElement {
    const display = getItemDisplay(itemId);
    const label = itemId.replace(/_/g, " ");

    const tile = document.createElement("div");
    tile.className = "mc-captcha__material";
    tile.dataset.itemId = itemId;
    tile.setAttribute("role", "listitem");
    tile.setAttribute("tabindex", "0");
    tile.setAttribute("draggable", "true");
    tile.setAttribute("aria-label", label);

    const item = document.createElement("div");
    item.className = "mc-captcha__item";

    const icon = document.createElement("span");
    icon.className = "mc-captcha__item-icon";
    icon.textContent = display.icon;
    icon.style.color = display.color;

    const labelEl = document.createElement("span");
    labelEl.className = "mc-captcha__item-label";
    labelEl.textContent = label;

    item.appendChild(icon);
    item.appendChild(labelEl);
    tile.appendChild(item);

    // Click to select for placement
    tile.addEventListener("click", () => {
      this.onMaterialSelected?.(itemId);
    });

    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tile.click();
      }
    });

    return tile;
  }
}
