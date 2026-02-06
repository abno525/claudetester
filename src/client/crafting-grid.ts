import type { CraftingGrid } from "../shared/types.js";
import { getItemDisplay } from "../shared/items.js";

/**
 * Manages the 3x3 crafting grid.
 * Handles rendering grid slots, placing/removing items,
 * and exposing the current grid state.
 */
export class CraftingGridComponent {
  private grid: CraftingGrid;
  private el: HTMLElement;
  private slots: HTMLElement[][] = [];

  /** Called when an item is removed from a slot */
  onItemRemoved: ((itemId: string, row: number, col: number) => void) | null =
    null;

  /** Called when a slot is clicked (for keyboard/click placement flow) */
  onSlotActivated: ((row: number, col: number) => void) | null = null;

  constructor(private size: number = 3) {
    this.grid = this.createEmptyGrid();
    this.el = this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  getGrid(): CraftingGrid {
    return this.grid.map((row) => [...row]);
  }

  /** Place an item into a grid slot. Returns the displaced item ID if any. */
  placeItem(row: number, col: number, itemId: string): string | null {
    const displaced = this.grid[row][col];
    this.grid[row][col] = itemId;
    this.renderSlot(row, col);
    return displaced;
  }

  /** Remove the item in a slot. Returns the item ID or null. */
  removeItem(row: number, col: number): string | null {
    const item = this.grid[row][col];
    if (item) {
      this.grid[row][col] = null;
      this.renderSlot(row, col);
    }
    return item;
  }

  /** Clear all grid slots */
  clear(): void {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.grid[r][c] = null;
        this.renderSlot(r, c);
      }
    }
  }

  /** Highlight a slot as a drop target */
  setDragOver(row: number, col: number, active: boolean): void {
    this.slots[row][col].classList.toggle("mc-drag-over", active);
  }

  /** Get the row/col from a slot element, or null */
  getSlotPosition(el: HTMLElement): { row: number; col: number } | null {
    const row = el.dataset.row;
    const col = el.dataset.col;
    if (row == null || col == null) return null;
    return { row: parseInt(row), col: parseInt(col) };
  }

  /** Check if an element is one of our grid slots */
  isSlot(el: HTMLElement): boolean {
    return el.classList.contains("mc-captcha__slot");
  }

  private createEmptyGrid(): CraftingGrid {
    return Array.from({ length: this.size }, () =>
      Array.from<string | null>({ length: this.size }).fill(null)
    );
  }

  private render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "mc-captcha__grid";
    wrapper.setAttribute("role", "grid");
    wrapper.setAttribute("aria-label", "Crafting grid");

    for (let r = 0; r < this.size; r++) {
      this.slots[r] = [];
      for (let c = 0; c < this.size; c++) {
        const slot = document.createElement("div");
        slot.className = "mc-captcha__slot";
        slot.dataset.row = String(r);
        slot.dataset.col = String(c);
        slot.setAttribute("role", "gridcell");
        slot.setAttribute("tabindex", "0");
        slot.setAttribute(
          "aria-label",
          `Grid slot row ${r + 1}, column ${c + 1}, empty`
        );

        // Click to remove item or activate for placement
        slot.addEventListener("click", () => {
          const item = this.grid[r][c];
          if (item) {
            this.removeItem(r, c);
            this.onItemRemoved?.(item, r, c);
          } else {
            this.onSlotActivated?.(r, c);
          }
        });

        // Keyboard support
        slot.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            slot.click();
          }
        });

        this.slots[r][c] = slot;
        wrapper.appendChild(slot);
      }
    }

    return wrapper;
  }

  private renderSlot(row: number, col: number): void {
    const slot = this.slots[row][col];
    const itemId = this.grid[row][col];
    slot.innerHTML = "";

    if (itemId) {
      const display = getItemDisplay(itemId);
      const itemEl = document.createElement("div");
      itemEl.className = "mc-captcha__item";

      const icon = document.createElement("span");
      icon.className = "mc-captcha__item-icon";
      icon.textContent = display.icon;
      icon.style.color = display.color;

      const label = document.createElement("span");
      label.className = "mc-captcha__item-label";
      label.textContent = itemId.replace(/_/g, " ");

      itemEl.appendChild(icon);
      itemEl.appendChild(label);
      slot.appendChild(itemEl);

      slot.setAttribute(
        "aria-label",
        `Grid slot row ${row + 1}, column ${col + 1}: ${itemId.replace(/_/g, " ")}`
      );
    } else {
      slot.setAttribute(
        "aria-label",
        `Grid slot row ${row + 1}, column ${col + 1}, empty`
      );
    }
  }
}
