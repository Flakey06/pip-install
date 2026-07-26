import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5173";

test.describe("a user can create an account for interest selection", () => {
  test("a user can create an account, add an interest, and remove it", async ({ page }) => {
    const timestamp = Date.now();
    const email = `123-${timestamp}@example.com`;
    const password = "Password123!";
    const username = `123${timestamp}`;
    const interest = "jogging";

    await page.goto(BASE_URL);

    await page
      .getByRole("button", { name: /new here\? create an account/i })
      .click();

    await page.getByPlaceholder("your@email.com").fill(email);
    await page.getByPlaceholder("min 6 characters").fill(password);
    await page.getByPlaceholder("repeat password").fill(password);
    await page.getByRole("button", { name: /^create account$/i }).click();

    await expect(page).toHaveURL(/\/create-profile/);

    await page.getByRole("button", { name: /skip for now|looks good/i }).click();

    await page.getByPlaceholder("e.g. jamie123").fill(username);
    await page.getByRole("button", { name: /next/i }).click();

    await page.getByPlaceholder("e.g. Computer Science").fill("Computer Science");
    await page.getByRole("button", { name: /^year 1$/i }).click();
    await page.getByRole("button", { name: /next/i }).click();

    await page.getByRole("button", { name: /skip|next/i }).click();

    const interestInput = page.getByPlaceholder("Type an interest + Enter to add...");
    await interestInput.fill(interest);
    await interestInput.press("Enter");

    const selectedInterest = page
      .locator("span")
      .filter({ hasText: interest })
      .filter({ has: page.getByRole("button", { name: "×" }) });

    await expect(selectedInterest).toBeVisible();

    await selectedInterest.getByRole("button", { name: "×" }).click();

    await expect(selectedInterest).toHaveCount(0);
    await expect(page.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
