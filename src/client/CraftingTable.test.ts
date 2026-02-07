// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CraftingTable } from "./CraftingTable.js";
import type { CaptchaChallenge, CaptchaAnswer } from "../shared/types.js";

function createMockDropEvent(itemId: string): Event {
  const event = new Event("drop", { bubbles: true });
  event.preventDefault = vi.fn();
  Object.defineProperty(event, "dataTransfer", {
    value: { getData: () => itemId },
  });
  return event;
}

function createMockDragoverEvent(): Event {
  const event = new Event("dragover", { bubbles: true });
  event.preventDefault = vi.fn();
  return event;
}

function makeChallenge(): CaptchaChallenge {
  return {
    challengeId: "test-challenge-123",
    prompt: "Craft: Wooden Pickaxe",
    availableItems: ["oak_planks", "stick", "cobblestone"],
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

describe("CraftingTable", () => {
  let container: HTMLElement;
  let challenge: CaptchaChallenge;
  let onSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    challenge = makeChallenge();
    onSubmit = vi.fn();
  });

  describe("render()", () => {
    it("renders a wrapper element inside the container", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      expect(container.querySelector(".mc-crafting-wrapper")).not.toBeNull();
    });

    it("renders the prompt as a title", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      const title = container.querySelector(".mc-crafting-title");
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe("Craft: Wooden Pickaxe");
    });

    it("renders a 3x3 grid with 9 slots", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      const slots = container.querySelectorAll(".mc-slot");
      expect(slots.length).toBe(9);
    });

    it("each slot has correct row and col data attributes", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      const slots = container.querySelectorAll(".mc-slot");
      let idx = 0;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const slot = slots[idx] as HTMLElement;
          expect(slot.dataset.row).toBe(String(row));
          expect(slot.dataset.col).toBe(String(col));
          idx++;
        }
      }
    });

    it("renders an item tray with all available items", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      const trayItems = container.querySelectorAll(".mc-item");
      expect(trayItems.length).toBe(challenge.availableItems.length);

      const itemIds = Array.from(trayItems).map(
        (el) => (el as HTMLElement).dataset.item,
      );
      for (const item of challenge.availableItems) {
        expect(itemIds).toContain(item);
      }
    });

    it("renders draggable items with sprite icons", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      const items = container.querySelectorAll(".mc-item");
      for (const item of items) {
        const el = item as HTMLElement;
        expect(el.draggable).toBe(true);
        expect(el.dataset.item).toBeDefined();
        // Should contain an icon span instead of plain text
        const icon = el.querySelector(".mc-item-icon") as HTMLElement;
        expect(icon).not.toBeNull();
        // Icon should have a tooltip with display name (no underscores)
        expect(icon.title).not.toContain("_");
        expect(icon.title.length).toBeGreaterThan(0);
      }
    });

    it("renders a Craft! button", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      const btn = container.querySelector(".mc-craft-btn") as HTMLElement;
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe("Craft!");
    });
  });

  describe("destroy()", () => {
    it("clears the container", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      expect(container.children.length).toBeGreaterThan(0);
      table.destroy();
      expect(container.innerHTML).toBe("");
    });
  });

  describe("submit", () => {
    it("calls onSubmit with challengeId and an empty grid when nothing is placed", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();

      const btn = container.querySelector(".mc-craft-btn") as HTMLElement;
      btn.click();

      expect(onSubmit).toHaveBeenCalledTimes(1);
      const answer: CaptchaAnswer = onSubmit.mock.calls[0][0];
      expect(answer.challengeId).toBe("test-challenge-123");
      expect(answer.grid).toEqual([
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });
  });

  describe("slot click to clear", () => {
    it("clears a slot when clicked", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();

      const slot = container.querySelector(
        '.mc-slot[data-row="0"][data-col="0"]',
      ) as HTMLElement;

      // Simulate drop first by dispatching a drop event
      slot.dispatchEvent(createMockDropEvent("oak_planks"));

      // Should contain an icon element after drop
      const icon = slot.querySelector(".mc-item-icon");
      expect(icon).not.toBeNull();
      expect(slot.classList.contains("mc-slot--filled")).toBe(true);

      // Click to clear
      slot.click();
      expect(slot.innerHTML).toBe("");
      expect(slot.classList.contains("mc-slot--filled")).toBe(false);
    });
  });

  describe("drag and drop", () => {
    it("adds hover class on dragover and removes on dragleave", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();

      const slot = container.querySelector(
        '.mc-slot[data-row="1"][data-col="1"]',
      ) as HTMLElement;

      slot.dispatchEvent(createMockDragoverEvent());
      expect(slot.classList.contains("mc-slot--hover")).toBe(true);

      slot.dispatchEvent(new Event("dragleave"));
      expect(slot.classList.contains("mc-slot--hover")).toBe(false);
    });

    it("places an item in the grid on drop and renders an icon", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();

      const slot = container.querySelector(
        '.mc-slot[data-row="0"][data-col="1"]',
      ) as HTMLElement;

      slot.dispatchEvent(createMockDropEvent("stick"));

      // Should render an icon element
      const icon = slot.querySelector(".mc-item-icon") as HTMLElement;
      expect(icon).not.toBeNull();
      expect(icon.title).toBe("Stick");
      expect(slot.classList.contains("mc-slot--filled")).toBe(true);
      expect(slot.classList.contains("mc-slot--hover")).toBe(false);

      // Verify the grid is updated by submitting
      const btn = container.querySelector(".mc-craft-btn") as HTMLElement;
      btn.click();
      const answer: CaptchaAnswer = onSubmit.mock.calls[0][0];
      expect(answer.grid[0][1]).toBe("stick");
    });
  });
});
