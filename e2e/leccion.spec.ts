import { test, expect, type Page } from "@playwright/test";

/**
 * Critical lesson flow in a real Chromium browser, including the space bar
 * (regression: space was reported broken in Brave/Chromium). Exercises are
 * read from the DOM so the tests survive curriculum growth.
 */

async function typeCurrentExercise(page: Page) {
  const target = page.locator("p[aria-label^='Texto a escribir']");
  const label = await target.getAttribute("aria-label");
  const text = label!.replace("Texto a escribir: ", "");
  await page.keyboard.type(text, { delay: 15 });
}

async function completeLesson(page: Page) {
  while (
    !(await page
      .getByText("Lección completada")
      .isVisible()
      .catch(() => false))
  ) {
    await typeCurrentExercise(page);
  }
}

test("typing with spaces advances through a whole lesson and shows results", async ({
  page,
}) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText(/Ejercicio 1 de \d+/)).toBeVisible();

  await typeCurrentExercise(page);
  await expect(page.getByText(/Ejercicio 2 de \d+/)).toBeVisible();

  await completeLesson(page);
  await expect(page.getByText("Lección completada")).toBeVisible();
  await expect(page.getByText("+20 XP")).toBeVisible();
});

test("the space bar alone advances past a space position", async ({ page }) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText(/Ejercicio 1 de \d+/)).toBeVisible();

  // First exercise is "fff jjj fff jjj": type up to the first space, then
  // press ONLY the space bar.
  await page.keyboard.type("fff", { delay: 15 });
  await page.keyboard.press("Space");
  await page.keyboard.type("jjj", { delay: 15 });

  // 7 of 15 characters done, so index 7 (the second space) is now current.
  // If the space bar had not registered, typing would have stalled at "fff".
  const current = page.locator("p[aria-label^='Texto a escribir'] span").nth(7);
  await expect(current).toHaveClass(/bg-brand-100/);
});

test("errors do not advance and are counted in the results", async ({ page }) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText(/Ejercicio 1 de \d+/)).toBeVisible();

  await page.keyboard.type("x", { delay: 15 }); // wrong on purpose
  await expect(page.getByText(/Ejercicio 1 de \d+/)).toBeVisible();

  await completeLesson(page);
  await expect(page.getByText("Lección completada")).toBeVisible();
  const errores = page
    .locator("dt", { hasText: "Errores" })
    .locator("xpath=following-sibling::dd");
  await expect(errores).toHaveText("1");
});

test("completed lessons survive a reload (persistence)", async ({ page }) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText(/Ejercicio 1 de \d+/)).toBeVisible();

  await completeLesson(page);
  await expect(page.getByText("Lección completada")).toBeVisible();

  await page.goto("/curso");
  await page.reload();
  const firstNode = page.getByRole("link", {
    name: "Lección 1: Las anclas F y J",
  });
  await expect(firstNode.getByText("✓")).toBeVisible();
});
