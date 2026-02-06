import type { Material } from "../shared/types";
import { getItemDisplay } from "../shared/items";

/**
 * Renders the available materials the user can drag onto the grid.
 * Tracks remaining counts as items are placed/returned.
 */
export class MaterialsPanel {
  private el: HTMLElement;
  private remaining: Map<string, number> = new Map();
  private materialEls: Map<string, HTMLElement> = new Map();
  private materials: Material[] = [];

  /** Called when a material is selected (clicked for placement) */
  onMaterialSelected: ((itemId: string) => void) | null = null;

  constructor() {
    this.el = document.createElement("div");
  }

  getElement(): HTMLElement {
    return this.el;
  }

  /** Set the available materials and render them */
  setMaterials(materials: Material[]): void {
    this.materials = materials;
    this.remaining.clear();
    this.materialEls.clear();

    for (const m of materials) {
      this.remaining.set(m.id, m.count);
    }

    this.render();
  }

  /** Use one unit of a material. Returns false if none remaining. */
  consume(itemId: string): boolean {
    const count = this.remaining.get(itemId) ?? 0;
    if (count <= 0) return false;
    this.remaining.set(itemId, count - 1);
    this.updateMaterialEl(itemId);
    return true;
  }

  /** Return one unit of a material to the pool */
  restore(itemId: string): void {
    const count = this.remaining.get(itemId) ?? 0;
    this.remaining.set(itemId, count + 1);
    this.updateMaterialEl(itemId);
  }

  /** Get the remaining count for a material */
  getRemaining(itemId: string): number {
    return this.remaining.get(itemId) ?? 0;
  }

  /** Get the material element for drag initiation */
  getMaterialElement(itemId: string): HTMLElement | undefined {
    return this.materialEls.get(itemId);
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

    for (const m of this.materials) {
      const tile = this.createMaterialTile(m);
      this.materialEls.set(m.id, tile);
      container.appendChild(tile);
    }

    this.el.appendChild(container);
  }

  private createMaterialTile(material: Material): HTMLElement {
    const display = getItemDisplay(material.id);
    const tile = document.createElement("div");
    tile.className = "mc-captcha__material";
    tile.dataset.itemId = material.id;
    tile.setAttribute("role", "listitem");
    tile.setAttribute("tabindex", "0");
    tile.setAttribute("draggable", "true");
    tile.setAttribute(
      "aria-label",
      `${material.label}, ${material.count} available`
    );

    const item = document.createElement("div");
    item.className = "mc-captcha__item";

    const icon = document.createElement("span");
    icon.className = "mc-captcha__item-icon";
    icon.textContent = display.icon;
    icon.style.color = display.color;

    const labelEl = document.createElement("span");
    labelEl.className = "mc-captcha__item-label";
    labelEl.textContent = material.label;

    item.appendChild(icon);
    item.appendChild(labelEl);
    tile.appendChild(item);

    const countEl = document.createElement("span");
    countEl.className = "mc-captcha__material-count";
    countEl.textContent = String(material.count);
    tile.appendChild(countEl);

    // Click to select for placement
    tile.addEventListener("click", () => {
      if ((this.remaining.get(material.id) ?? 0) > 0) {
        this.onMaterialSelected?.(material.id);
      }
    });

    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tile.click();
      }
    });

    return tile;
  }

  private updateMaterialEl(itemId: string): void {
    const tile = this.materialEls.get(itemId);
    if (!tile) return;

    const count = this.remaining.get(itemId) ?? 0;
    const countEl = tile.querySelector(".mc-captcha__material-count");
    if (countEl) countEl.textContent = String(count);

    tile.classList.toggle("mc-disabled", count <= 0);
    tile.setAttribute(
      "aria-label",
      `${itemId.replace(/_/g, " ")}, ${count} available`
    );
  }
}
