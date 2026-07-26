import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5173";
const PASSWORD = "Password123!";
const INTEREST = "jogging";

function todayAsInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function logBrowserErrors(page, label) {
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      console.log(`${label} ${message.type()}: ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    console.log(`${label} page error: ${error.message}`);
  });
}

async function createAccountWithProfile(page, email, username) {
  await page.goto(BASE_URL);

  await page
    .getByRole("button", { name: /new here\? create an account/i })
    .click();

  await page.getByPlaceholder("your@email.com").fill(email);
  await page.getByPlaceholder("min 6 characters").fill(PASSWORD);
  await page.getByPlaceholder("repeat password").fill(PASSWORD);
  await page.getByRole("button", { name: /^create account$/i }).click();

  await expect(page).toHaveURL(/\/create-profile/, { timeout: 30_000 });

  await page.getByRole("button", { name: /skip for now|looks good/i }).click();

  await page.getByPlaceholder("e.g. jamie123").fill(username);
  await page.getByRole("button", { name: /next/i }).click();

  await page.getByPlaceholder("e.g. Computer Science").fill("Computer Science");
  await page.getByRole("button", { name: /^year 1$/i }).click();
  await page.getByRole("button", { name: /next/i }).click();

  await page.getByRole("button", { name: /skip|next/i }).click();

  const interestInput = page.getByPlaceholder("Type an interest + Enter to add...");
  await interestInput.fill(INTEREST);
  await interestInput.press("Enter");

  const selectedInterest = page
    .locator("span")
    .filter({ hasText: INTEREST })
    .filter({ has: page.getByRole("button", { name: "×" }) });

  await expect(selectedInterest).toBeVisible();

  await page.getByRole("button", { name: /next/i }).click();
  await page.getByRole("button", { name: /let's go/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);
}

async function createJoggingGroup(page, groupName) {
  await page.goto(`${BASE_URL}/explore`);

  await page.getByRole("button", { name: /^create$/i }).click();
  await page.getByPlaceholder("e.g. Basketball Fans SG").fill(groupName);
  await page.getByPlaceholder("basketball, sports, fitness").fill(INTEREST);
  await page.getByRole("button", { name: /^create group$/i }).click();

  await expect(page).toHaveURL(/\/chat\//);
}

async function joinGroup(page, groupName) {
  await page.goto(`${BASE_URL}/explore`);
  await page.getByPlaceholder("Search interests or groups...").fill(groupName);

  const groupRow = page.locator(".list-row").filter({ hasText: groupName });
  await expect(groupRow).toBeVisible();
  await groupRow.getByRole("button", { name: /^join$/i }).click();

  await expect(page).toHaveURL(/\/chat\//);
}

test.describe("a user can utilise the functions in a group", () => {
  test("a user can create a group and the call, game, calendar and friend\
     functions all work", async ({ browser }) => {
    test.setTimeout(120_000);

    const timestamp = Date.now();
    const firstContext = await browser.newContext();
    const secondContext = await browser.newContext();
    const firstPage = await firstContext.newPage();
    const secondPage = await secondContext.newPage();

    logBrowserErrors(firstPage, "first user");
    logBrowserErrors(secondPage, "second user");

    const firstUsername = `123${timestamp}`;
    const secondUsername = `456${timestamp}`;
    const groupName = `Jogging Friends ${timestamp}`;
    const editedGroupName = `Edited Jogging Friends ${timestamp}`;
    const eventTitle = `Jogging meetup ${timestamp}`;

    // Setting up first account
    await createAccountWithProfile(
      firstPage,
      `123${timestamp}@example.com`,
      firstUsername
    );
    await createJoggingGroup(firstPage, groupName);

    // Testing edit group functionality
    await firstPage.getByText(groupName).click();
    await expect(firstPage).toHaveURL(/\/group-info\//);

    await firstPage.getByRole("button", { name: /edit/i }).click();
    await firstPage.locator("input").first().fill(editedGroupName);
    await firstPage.getByRole("button", { name: /^save$/i }).click();

    await expect(firstPage.locator("p").filter({ hasText: editedGroupName })).toBeVisible();

    // Testing the group call functionality
    await firstPage.getByRole("button", { name: /call/i }).click();

    await expect(firstPage.getByText("Video Call")).toBeVisible();
    await expect(firstPage.getByText(/meet\.jit\.si\/pip-install-/i)).toBeVisible();

    const jitsiPagePromise = firstPage.context().waitForEvent("page");

    await firstPage.getByRole("button", { name: /join call/i }).click();

    const jitsiPage = await jitsiPagePromise;
    await expect(jitsiPage).toHaveURL(/meet\.jit\.si/);
    await jitsiPage.close();
    await firstPage.getByRole("button", { name: /^close$/i }).click();

    //Testing games functionality
    await firstPage.getByRole("button", { name: /games/i }).click();

    await expect(firstPage.getByText("Mini Games")).toBeVisible();
    await firstPage.getByRole("button", { name: /would you rather/i }).click();

    await expect(firstPage.getByText("Would You Rather")).toBeVisible();
    await firstPage.getByRole("button", { name: /menu/i }).click();
    await expect(firstPage.getByText("Mini Games")).toBeVisible();
    await firstPage.getByRole("button", { name: /^close$/i }).click();

    //Testing calendar functionality
    await firstPage.getByRole("button", { name: /calendar/i }).click();
    await expect(firstPage).toHaveURL(/\/calendar\//);

    await firstPage.getByRole("button", { name: /\+ add/i }).click();
    await firstPage.getByPlaceholder("e.g. Basketball at UTown").fill(eventTitle);
    await firstPage.getByPlaceholder("e.g. UTown Sports Hall").fill("UTown");
    await firstPage.getByPlaceholder("Any extra details...").fill("Bring running shoes");
    await firstPage.locator('input[type="date"]').fill(todayAsInputDate());
    await firstPage.locator('input[type="time"]').fill("18:30");
    await firstPage.getByRole("button", { name: /add to calendar/i }).click();

    await expect(firstPage.getByText("New Event")).toBeHidden({ timeout: 20_000 });
    await expect(firstPage.getByText(eventTitle)).toBeVisible({ timeout: 20_000 });

    // Testing friend requests
    await createAccountWithProfile(
      secondPage,
      `456${timestamp}@example.com`,
      secondUsername
    );
    await joinGroup(secondPage, editedGroupName);

    await expect(secondPage.getByAltText(firstUsername)).toBeVisible();
    await secondPage.getByAltText(firstUsername).click();
    await expect(secondPage.locator("h3").filter({ hasText: firstUsername })).toBeVisible();
    await secondPage.getByRole("button", { name: /add friend/i }).click();
    await expect(secondPage.getByRole("button", { name: /request sent/i })).toBeVisible();

    await firstPage.goto(`${BASE_URL}/friends`);

    const requestRow = firstPage.locator(".list-row").filter({ hasText: secondUsername });
    await expect(requestRow).toBeVisible();
    await requestRow.click();

    await firstPage.getByRole("button", { name: /accept friend request/i }).click();
    await expect(firstPage.getByRole("button", { name: /friends/i })).toBeVisible();

    await firstContext.close();
    await secondContext.close();
  });
});
