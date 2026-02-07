// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CraftingTable } from "./CraftingTable.js";
import type { CaptchaChallenge, CaptchaAnswer } from "../shared/types.js";

function makeChallenge(): CaptchaChallenge {
  return {
    challengeId: "test-challenge-123",
    prompt: "Craft: Wooden Pickaxe",
    availableItems: ["oak_planks", "stick", "cobblestone"],
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

function mockDropEvent(itemId: string): Event {
  const e = new Event("drop", { bubbles: true });
  e.preventDefault = vi.fn();
  Object.defineProperty(e, "dataTransfer", {
    value: { getData: () => itemId },
  });
  return e;
}

function mockDragoverEvent(): Event {
  const e = new Event("dragover", { bubbles: true });
  e.preventDefault = vi.fn();
  return e;
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

    it("renders draggable items with display-friendly text", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();
      const items = container.querySelectorAll(".mc-item");
      for (const item of items) {
        const el = item as HTMLElement;
        expect(el.draggable).toBe(true);
        // underscores replaced with spaces
        expect(el.textContent).not.toContain("_");
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
      slot.dispatchEvent(mockDropEvent("oak_planks"));

      expect(slot.textContent).toBe("oak planks");
      expect(slot.classList.contains("mc-slot--filled")).toBe(true);

      // Click to clear
      slot.click();
      expect(slot.textContent).toBe("");
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

      slot.dispatchEvent(mockDragoverEvent());
      expect(slot.classList.contains("mc-slot--hover")).toBe(true);

      slot.dispatchEvent(new Event("dragleave"));
      expect(slot.classList.contains("mc-slot--hover")).toBe(false);
    });

    it("places an item in the grid on drop and updates the slot text", () => {
      const table = new CraftingTable(container, challenge, onSubmit);
      table.render();

      const slot = container.querySelector(
        '.mc-slot[data-row="0"][data-col="1"]',
      ) as HTMLElement;

      slot.dispatchEvent(mockDropEvent("stick"));

      expect(slot.textContent).toBe("stick");
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
