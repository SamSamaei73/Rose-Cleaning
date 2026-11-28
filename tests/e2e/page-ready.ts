import { expect, type Page } from "@playwright/test";

// fill() can run while CSS interactivity blocks real keyboard input. Wait for
// hydration and the loading dialog before entering values into a form.
export async function waitForPageReady(page: Page) {
  await expect(page.locator("#application")).not.toHaveCSS(
    "interactivity",
    "inert",
  );
  await expect(page.locator("#global-loading-overlay")).toBeHidden();
}
