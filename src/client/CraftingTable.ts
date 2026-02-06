import type {
  CaptchaChallenge,
  CaptchaAnswer,
  CraftingGrid,
  ItemId,
} from "../shared/types.js";

/**
 * Renders a 3x3 Minecraft crafting grid with drag-and-drop item placement.
 * This is the core UI component of the captcha widget.
 */
export class CraftingTable {
  private container: HTMLElement;
  private challenge: CaptchaChallenge;
  private onSubmit: (answer: CaptchaAnswer) => void;
  private grid: CraftingGrid;

  constructor(
    container: HTMLElement,
    challenge: CaptchaChallenge,
    onSubmit: (answer: CaptchaAnswer) => void
  ) {
    this.container = container;
    this.challenge = challenge;
    this.onSubmit = onSubmit;
    this.grid = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
  }

  render(): void {
    const wrapper = document.createElement("div");
    wrapper.className = "mc-crafting-wrapper";

    // Title / prompt
    const title = document.createElement("div");
    title.className = "mc-crafting-title";
    title.textContent = this.challenge.prompt;
    wrapper.appendChild(title);

    // Crafting grid (3x3)
    const gridEl = document.createElement("div");
    gridEl.className = "mc-crafting-grid";

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const slot = document.createElement("div");
        slot.className = "mc-slot";
        slot.dataset.row = String(row);
        slot.dataset.col = String(col);
        this.setupDropTarget(slot, row, col);
        gridEl.appendChild(slot);
      }
    }
    wrapper.appendChild(gridEl);

    // Available items tray
    const tray = document.createElement("div");
    tray.className = "mc-item-tray";
    for (const item of this.challenge.availableItems) {
      const itemEl = this.createDraggableItem(item);
      tray.appendChild(itemEl);
    }
    wrapper.appendChild(tray);

    // Craft button
    const btn = document.createElement("button");
    btn.className = "mc-craft-btn";
    btn.textContent = "Craft!";
    btn.addEventListener("click", () => this.submit());
    wrapper.appendChild(btn);

    this.container.appendChild(wrapper);
  }

  destroy(): void {
    this.container.innerHTML = "";
  }

  private createDraggableItem(itemId: ItemId): HTMLElement {
    const el = document.createElement("div");
    el.className = "mc-item";
    el.draggable = true;
    el.dataset.item = itemId;
    el.textContent = itemId.replace(/_/g, " ");
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", itemId);
    });
    return el;
  }

  private setupDropTarget(slot: HTMLElement, row: number, col: number): void {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("mc-slot--hover");
    });
    slot.addEventListener("dragleave", () => {
      slot.classList.remove("mc-slot--hover");
    });
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("mc-slot--hover");
      const itemId = e.dataTransfer?.getData("text/plain") ?? null;
      this.grid[row][col] = itemId;
      slot.textContent = itemId ? itemId.replace(/_/g, " ") : "";
      slot.classList.toggle("mc-slot--filled", itemId !== null);
    });
    // Click to clear
    slot.addEventListener("click", () => {
      this.grid[row][col] = null;
      slot.textContent = "";
      slot.classList.remove("mc-slot--filled");
    });
  }

  private submit(): void {
    this.onSubmit({
      challengeId: this.challenge.challengeId,
      grid: this.grid,
    });
  }
}
