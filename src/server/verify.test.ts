import { describe, it, expect } from "vitest";
import { generateCookieValue, validateCookie } from "./verify.js";

describe("captcha cookie", () => {
  it("generates a cookie that can be validated", () => {
    const cookie = generateCookieValue();
    expect(validateCookie(cookie)).toBe(true);
  });

  it("rejects a tampered cookie", () => {
    const cookie = generateCookieValue();
    const tampered = cookie.slice(0, -1) + "x";
    expect(validateCookie(tampered)).toBe(false);
  });

  it("rejects garbage input", () => {
    expect(validateCookie("")).toBe(false);
    expect(validateCookie("not-a-cookie")).toBe(false);
  });
});
