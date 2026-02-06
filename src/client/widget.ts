import type {
  CaptchaWidgetOptions,
  CaptchaChallenge,
  CaptchaResult,
} from "../shared/types.js";
import { getItemDisplay } from "../shared/items.js";
import { CaptchaApi } from "./api.js";
import { CraftingGridComponent } from "./crafting-grid.js";
import { MaterialsPanel } from "./materials-panel.js";

/**
 * Main CAPTCHA widget. Orchestrates the crafting grid, materials panel,
 * drag-and-drop, API calls, timer, and lifecycle callbacks.
 */
export class CaptchaWidget {
  private container: HTMLElement;
  private api: CaptchaApi;
  private theme: string;
  private challenge: CaptchaChallenge | null = null;
  private grid: CraftingGridComponent | null = null;
  private materials: MaterialsPanel | null = null;

  private rootEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private timerEl: HTMLElement | null = null;
  private verifyBtn: HTMLButtonElement | null = null;

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private resolved = false;

  // Drag-and-drop state
  private dragItemId: string | null = null;
  private dragSourceSlot: { row: number; col: number } | null = null;
  private ghostEl: HTMLElement | null = null;

  // Click-to-place state
  private selectedMaterial: string | null = null;

  private onSuccess?: (result: CaptchaResult) => void;
  private onFailure?: (result: CaptchaResult) => void;
  private onExpire?: () => void;

  constructor(container: HTMLElement, options: CaptchaWidgetOptions) {
    this.container = container;
    this.theme = options.theme ?? "classic";
    this.api = new CaptchaApi(options.apiUrl ?? "");
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
    this.onExpire = options.onExpire;
  }

  /** Start the widget: fetch a challenge and render the UI */
  async start(): Promise<void> {
    this.container.innerHTML = "";
    this.resolved = false;
    this.selectedMaterial = null;

    this.rootEl = document.createElement("div");
    this.rootEl.className = `mc-captcha mc-theme-${this.theme}`;

    // Show loading state
    const loading = document.createElement("div");
    loading.className = "mc-captcha__loading";
    loading.textContent = "Loading challenge...";
    this.rootEl.appendChild(loading);
    this.container.appendChild(this.rootEl);

    try {
      this.challenge = await this.api.getChallenge();
      this.renderChallenge();
    } catch {
      loading.textContent = "Failed to load challenge";
    }
  }

  /** Tear down the widget */
  destroy(): void {
    this.stopTimer();
    this.removeDragListeners();
    this.container.innerHTML = "";
    this.resolved = true;
  }

  private renderChallenge(): void {
    if (!this.rootEl || !this.challenge) return;
    this.rootEl.innerHTML = "";

    // Title / prompt (e.g. "Craft: Wooden Pickaxe")
    const title = document.createElement("div");
    title.className = "mc-captcha__title";
    title.textContent = this.challenge.prompt;
    this.rootEl.appendChild(title);

    // Materials panel
    this.materials = new MaterialsPanel();
    this.materials.setItems(this.challenge.availableItems);
    this.materials.onMaterialSelected = (itemId) =>
      this.handleMaterialSelected(itemId);
    this.rootEl.appendChild(this.materials.getElement());

    // Crafting area: grid + arrow + output
    const craftingArea = document.createElement("div");
    craftingArea.className = "mc-captcha__crafting";

    this.grid = new CraftingGridComponent(3);
    this.grid.onItemRemoved = () => {}; // Items have unlimited supply
    this.grid.onSlotActivated = (row, col) =>
      this.handleSlotActivated(row, col);
    craftingArea.appendChild(this.grid.getElement());

    // Parse the target item from the prompt (e.g. "Craft: Wooden Pickaxe" → guess item id)
    const targetLabel = this.challenge.prompt.replace(/^Craft:\s*/i, "");
    const targetItemId = targetLabel.toLowerCase().replace(/\s+/g, "_");
    const display = getItemDisplay(targetItemId);

    const arrow = document.createElement("div");
    arrow.className = "mc-captcha__arrow";
    arrow.textContent = "\u27A1"; // ➡
    arrow.setAttribute("aria-hidden", "true");
    craftingArea.appendChild(arrow);

    const output = document.createElement("div");
    output.className = "mc-captcha__output";
    const outputItem = document.createElement("div");
    outputItem.className = "mc-captcha__item";
    const outputIcon = document.createElement("span");
    outputIcon.className = "mc-captcha__item-icon";
    outputIcon.textContent = display.icon;
    outputIcon.style.color = display.color;
    outputIcon.style.fontSize = "28px";
    const outputLabel = document.createElement("span");
    outputLabel.className = "mc-captcha__item-label";
    outputLabel.textContent = targetLabel;
    outputItem.appendChild(outputIcon);
    outputItem.appendChild(outputLabel);
    output.appendChild(outputItem);
    craftingArea.appendChild(output);

    this.rootEl.appendChild(craftingArea);

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "mc-captcha__actions";

    const clearBtn = document.createElement("button");
    clearBtn.className = "mc-captcha__btn mc-captcha__btn--clear";
    clearBtn.textContent = "Clear";
    clearBtn.type = "button";
    clearBtn.addEventListener("click", () => this.handleClear());
    actions.appendChild(clearBtn);

    this.verifyBtn = document.createElement("button");
    this.verifyBtn.className = "mc-captcha__btn";
    this.verifyBtn.textContent = "Craft!";
    this.verifyBtn.type = "button";
    this.verifyBtn.addEventListener("click", () => this.handleVerify());
    actions.appendChild(this.verifyBtn);

    this.rootEl.appendChild(actions);

    // Status line
    this.statusEl = document.createElement("div");
    this.statusEl.className = "mc-captcha__status";
    this.rootEl.appendChild(this.statusEl);

    // Timer bar
    this.timerEl = document.createElement("div");
    this.timerEl.className = "mc-captcha__timer";
    this.timerEl.style.width = "100%";
    this.rootEl.appendChild(this.timerEl);

    // Set up timer
    this.startTimer();

    // Set up drag-and-drop
    this.setupDragAndDrop();
  }

  // ── Click-to-place flow ──────────────────────────

  private handleMaterialSelected(itemId: string): void {
    if (this.resolved) return;
    this.selectedMaterial = itemId;
    this.setStatus(`Click a grid slot to place ${itemId.replace(/_/g, " ")}`);
  }

  private handleSlotActivated(row: number, col: number): void {
    if (this.resolved || !this.selectedMaterial || !this.grid) return;
    this.grid.placeItem(row, col, this.selectedMaterial);
    this.selectedMaterial = null;
    this.setStatus("");
  }

  // ── Drag-and-drop ───────────────────────────────

  private setupDragAndDrop(): void {
    if (!this.rootEl) return;

    this.rootEl.addEventListener("dragstart", this.onDragStart);
    this.rootEl.addEventListener("dragover", this.onDragOver);
    this.rootEl.addEventListener("dragleave", this.onDragLeave);
    this.rootEl.addEventListener("drop", this.onDrop);
    this.rootEl.addEventListener("dragend", this.onDragEnd);

    // Touch events for mobile
    this.rootEl.addEventListener("touchstart", this.onTouchStart, {
      passive: false,
    });
    this.rootEl.addEventListener("touchmove", this.onTouchMove, {
      passive: false,
    });
    this.rootEl.addEventListener("touchend", this.onTouchEnd);
  }

  private removeDragListeners(): void {
    if (!this.rootEl) return;
    this.rootEl.removeEventListener("dragstart", this.onDragStart);
    this.rootEl.removeEventListener("dragover", this.onDragOver);
    this.rootEl.removeEventListener("dragleave", this.onDragLeave);
    this.rootEl.removeEventListener("drop", this.onDrop);
    this.rootEl.removeEventListener("dragend", this.onDragEnd);
    this.rootEl.removeEventListener("touchstart", this.onTouchStart);
    this.rootEl.removeEventListener("touchmove", this.onTouchMove);
    this.rootEl.removeEventListener("touchend", this.onTouchEnd);
  }

  // -- HTML5 Drag Events --

  private onDragStart = (e: DragEvent): void => {
    if (this.resolved) return;
    const target = e.target as HTMLElement;

    // Dragging from materials panel
    if (this.materials?.isMaterial(target)) {
      const itemId = this.materials.getItemId(target);
      if (itemId) {
        this.dragItemId = itemId;
        this.dragSourceSlot = null;
        e.dataTransfer?.setData("text/plain", itemId);
      } else {
        e.preventDefault();
      }
      return;
    }

    // Dragging from grid slot
    if (this.grid?.isSlot(target)) {
      const pos = this.grid.getSlotPosition(target);
      if (pos) {
        const gridState = this.grid.getGrid();
        const itemId = gridState[pos.row][pos.col];
        if (itemId) {
          this.dragItemId = itemId;
          this.dragSourceSlot = pos;
          e.dataTransfer?.setData("text/plain", itemId);
          return;
        }
      }
    }

    e.preventDefault();
  };

  private onDragOver = (e: DragEvent): void => {
    if (!this.dragItemId || this.resolved) return;
    const slotEl = (e.target as HTMLElement).closest(
      ".mc-captcha__slot"
    ) as HTMLElement;
    if (slotEl && this.grid) {
      e.preventDefault(); // Allow drop
      const pos = this.grid.getSlotPosition(slotEl);
      if (pos) this.grid.setDragOver(pos.row, pos.col, true);
    }
  };

  private onDragLeave = (e: DragEvent): void => {
    const slotEl = (e.target as HTMLElement).closest(
      ".mc-captcha__slot"
    ) as HTMLElement;
    if (slotEl && this.grid) {
      const pos = this.grid.getSlotPosition(slotEl);
      if (pos) this.grid.setDragOver(pos.row, pos.col, false);
    }
  };

  private onDrop = (e: DragEvent): void => {
    e.preventDefault();
    if (!this.dragItemId || this.resolved || !this.grid) return;

    const slotEl = (e.target as HTMLElement).closest(
      ".mc-captcha__slot"
    ) as HTMLElement;
    if (!slotEl) return;

    const pos = this.grid.getSlotPosition(slotEl);
    if (!pos) return;

    this.grid.setDragOver(pos.row, pos.col, false);
    this.completeDrop(pos.row, pos.col);
  };

  private onDragEnd = (): void => {
    this.dragItemId = null;
    this.dragSourceSlot = null;
  };

  // -- Touch Events (mobile fallback) --

  private onTouchStart = (e: TouchEvent): void => {
    if (this.resolved) return;
    const target = e.target as HTMLElement;
    const touch = e.touches[0];

    // From materials
    if (this.materials?.isMaterial(target)) {
      const itemId = this.materials.getItemId(target);
      if (itemId) {
        e.preventDefault();
        this.dragItemId = itemId;
        this.dragSourceSlot = null;
        this.showGhost(itemId, touch.clientX, touch.clientY);
      }
      return;
    }

    // From grid
    if (this.grid?.isSlot(target)) {
      const pos = this.grid.getSlotPosition(target);
      if (pos) {
        const gridState = this.grid.getGrid();
        const itemId = gridState[pos.row][pos.col];
        if (itemId) {
          e.preventDefault();
          this.dragItemId = itemId;
          this.dragSourceSlot = pos;
          this.showGhost(itemId, touch.clientX, touch.clientY);
        }
      }
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.dragItemId || !this.ghostEl) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.ghostEl.style.left = `${touch.clientX}px`;
    this.ghostEl.style.top = `${touch.clientY}px`;
  };

  private onTouchEnd = (_e: TouchEvent): void => {
    if (!this.dragItemId || !this.grid) {
      this.hideGhost();
      return;
    }

    const touch = _e.changedTouches[0];
    const dropTarget = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    ) as HTMLElement;
    const slotEl = dropTarget?.closest(".mc-captcha__slot") as HTMLElement;

    if (slotEl) {
      const pos = this.grid.getSlotPosition(slotEl);
      if (pos) {
        this.completeDrop(pos.row, pos.col);
      }
    }

    this.hideGhost();
    this.dragItemId = null;
    this.dragSourceSlot = null;
  };

  private showGhost(itemId: string, x: number, y: number): void {
    this.hideGhost();
    const display = getItemDisplay(itemId);
    this.ghostEl = document.createElement("div");
    this.ghostEl.className = "mc-captcha__drag-ghost";
    this.ghostEl.textContent = display.icon;
    this.ghostEl.style.color = display.color;
    this.ghostEl.style.left = `${x}px`;
    this.ghostEl.style.top = `${y}px`;
    document.body.appendChild(this.ghostEl);
  }

  private hideGhost(): void {
    this.ghostEl?.remove();
    this.ghostEl = null;
  }

  /** Common drop logic shared by HTML5 drag and touch */
  private completeDrop(row: number, col: number): void {
    if (!this.dragItemId || !this.grid) return;

    if (this.dragSourceSlot) {
      // Moving from one grid slot to another
      this.grid.removeItem(this.dragSourceSlot.row, this.dragSourceSlot.col);
      const displaced = this.grid.placeItem(row, col, this.dragItemId);
      if (displaced) {
        // Put the displaced item into the source slot
        this.grid.placeItem(
          this.dragSourceSlot.row,
          this.dragSourceSlot.col,
          displaced
        );
      }
    } else {
      // Dragging from materials to grid (unlimited supply)
      this.grid.placeItem(row, col, this.dragItemId);
    }
  }

  // ── Verify ──────────────────────────────────────

  private async handleVerify(): Promise<void> {
    if (!this.challenge || !this.grid || this.resolved) return;

    this.setStatus("Verifying...");
    if (this.verifyBtn) this.verifyBtn.disabled = true;

    try {
      const result = await this.api.verify({
        challengeId: this.challenge.challengeId,
        grid: this.grid.getGrid(),
      });

      if (result.success) {
        this.resolved = true;
        this.stopTimer();
        this.setStatus(result.message ?? "CAPTCHA passed!", "success");
        this.onSuccess?.(result);
      } else {
        this.setStatus(
          result.message ?? "Incorrect recipe. Try again.",
          "error"
        );
        this.onFailure?.(result);
        if (this.verifyBtn) this.verifyBtn.disabled = false;
      }
    } catch {
      this.setStatus("Verification failed. Please try again.", "error");
      if (this.verifyBtn) this.verifyBtn.disabled = false;
    }
  }

  // ── Clear ───────────────────────────────────────

  private handleClear(): void {
    if (!this.grid || !this.challenge || this.resolved) return;
    this.grid.clear();
    this.selectedMaterial = null;
    this.setStatus("");
  }

  // ── Timer ───────────────────────────────────────

  private startTimer(): void {
    if (!this.challenge || !this.timerEl) return;

    const expiresAt = new Date(this.challenge.expiresAt).getTime();
    const now = Date.now();
    const totalMs = expiresAt - now;
    if (totalMs <= 0) {
      this.handleExpired();
      return;
    }

    this.timerInterval = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        this.handleExpired();
        return;
      }
      const pct = (remaining / totalMs) * 100;
      if (this.timerEl) this.timerEl.style.width = `${pct}%`;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleExpired(): void {
    this.stopTimer();
    if (this.timerEl) this.timerEl.style.width = "0%";
    this.setStatus("Challenge expired.", "error");
    this.resolved = true;
    this.onExpire?.();
  }

  // ── Helpers ─────────────────────────────────────

  private setStatus(
    text: string,
    type: "success" | "error" | "" = ""
  ): void {
    if (!this.statusEl) return;
    this.statusEl.textContent = text;
    this.statusEl.className = "mc-captcha__status";
    if (type) this.statusEl.classList.add(`mc-captcha__status--${type}`);
  }
}
