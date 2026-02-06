// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MinecraftCaptcha } from "./index.js";
import type { CaptchaChallenge, CaptchaResult } from "../shared/types.js";

const mockChallenge: CaptchaChallenge = {
  challengeId: "test-challenge-456",
  prompt: "Craft: Sticks",
  availableItems: ["oak_planks", "cobblestone"],
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
};

describe("MinecraftCaptcha", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock global fetch
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.remove();
  });

  it("constructor sets container and default apiUrl", () => {
    const captcha = new MinecraftCaptcha({ element: container });
    // The object is created without errors
    expect(captcha).toBeDefined();
  });

  describe("start()", () => {
    it("fetches a challenge and renders the crafting table", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockChallenge),
      });
      vi.stubGlobal("fetch", fetchMock);

      const captcha = new MinecraftCaptcha({ element: container });
      await captcha.start();

      // Verify fetch was called to get challenge
      expect(fetchMock).toHaveBeenCalledWith("/api/captcha/challenge", {
        method: "POST",
        credentials: "include",
      });

      // Verify the UI was rendered
      expect(container.classList.contains("mc-captcha")).toBe(true);
      expect(container.querySelector(".mc-crafting-wrapper")).not.toBeNull();
      expect(container.querySelector(".mc-crafting-grid")).not.toBeNull();
      expect(container.querySelector(".mc-craft-btn")).not.toBeNull();
    });

    it("uses custom apiUrl when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockChallenge),
      });
      vi.stubGlobal("fetch", fetchMock);

      const captcha = new MinecraftCaptcha({
        element: container,
        apiUrl: "https://captcha.example.com",
      });
      await captcha.start();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://captcha.example.com/api/captcha/challenge",
        expect.any(Object)
      );
    });

    it("throws when fetch fails", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal("fetch", fetchMock);

      const captcha = new MinecraftCaptcha({ element: container });
      await expect(captcha.start()).rejects.toThrow(
        "Failed to fetch captcha challenge"
      );
    });
  });

  describe("handleSubmit (via Craft button)", () => {
    it("calls onSuccess when verification succeeds", async () => {
      const successResult: CaptchaResult = {
        success: true,
        message: "Captcha solved!",
      };

      const fetchMock = vi
        .fn()
        // First call: fetch challenge
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockChallenge),
        })
        // Second call: verify answer
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(successResult),
        });
      vi.stubGlobal("fetch", fetchMock);

      const onSuccess = vi.fn();
      const onFailure = vi.fn();

      const captcha = new MinecraftCaptcha({
        element: container,
        onSuccess,
        onFailure,
      });
      await captcha.start();

      // Click the Craft button to trigger submission
      const btn = container.querySelector(".mc-craft-btn") as HTMLElement;
      btn.click();

      // Wait for the async handleSubmit to complete
      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });

      expect(onSuccess).toHaveBeenCalledWith(successResult);
      expect(onFailure).not.toHaveBeenCalled();

      // Verify the verify endpoint was called correctly
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const verifyCall = fetchMock.mock.calls[1];
      expect(verifyCall[0]).toBe("/api/captcha/verify");
      expect(verifyCall[1].method).toBe("POST");
      expect(verifyCall[1].headers["Content-Type"]).toBe("application/json");
      const body = JSON.parse(verifyCall[1].body);
      expect(body.challengeId).toBe("test-challenge-456");
      expect(body.grid).toBeDefined();
    });

    it("calls onFailure when verification fails", async () => {
      const failureResult: CaptchaResult = {
        success: false,
        message: "Incorrect crafting pattern",
      };

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockChallenge),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(failureResult),
        });
      vi.stubGlobal("fetch", fetchMock);

      const onSuccess = vi.fn();
      const onFailure = vi.fn();

      const captcha = new MinecraftCaptcha({
        element: container,
        onSuccess,
        onFailure,
      });
      await captcha.start();

      const btn = container.querySelector(".mc-craft-btn") as HTMLElement;
      btn.click();

      await vi.waitFor(() => {
        expect(onFailure).toHaveBeenCalledTimes(1);
      });

      expect(onFailure).toHaveBeenCalledWith(failureResult);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("destroy()", () => {
    it("clears the container", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockChallenge),
      });
      vi.stubGlobal("fetch", fetchMock);

      const captcha = new MinecraftCaptcha({ element: container });
      await captcha.start();

      expect(container.children.length).toBeGreaterThan(0);
      captcha.destroy();
      expect(container.innerHTML).toBe("");
    });

    it("can be called before start() without error", () => {
      const captcha = new MinecraftCaptcha({ element: container });
      expect(() => captcha.destroy()).not.toThrow();
    });
  });
});
