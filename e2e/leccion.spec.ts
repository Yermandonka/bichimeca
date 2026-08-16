import { test, expect } from "@playwright/test";

/**
 * Critical lesson flow in a real Chromium browser, including the space bar
 * (regression: space was reported broken in Brave/Chromium).
 */

const EXERCISES_W1L1 = ["fff jjj fff jjj", "fj fj jf jf fj jf", "fjf jfj ffj jjf fjj jff"];

test("typing with spaces advances through a whole lesson and shows results", async ({
  page,
}) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText("Ejercicio 1 de 3")).toBeVisible();

  await page.keyboard.type(EXERCISES_W1L1[0], { delay: 20 });
  await expect(page.getByText("Ejercicio 2 de 3")).toBeVisible();

  await page.keyboard.type(EXERCISES_W1L1[1], { delay: 20 });
  await expect(page.getByText("Ejercicio 3 de 3")).toBeVisible();

  await page.keyboard.type(EXERCISES_W1L1[2], { delay: 20 });
  await expect(page.getByText("Lección completada")).toBeVisible();
  await expect(page.getByText("+20 XP")).toBeVisible();
});

test("the space bar alone advances past a space position", async ({ page }) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText("Ejercicio 1 de 3")).toBeVisible();

  // Type up to the first space, then press ONLY the space bar.
  await page.keyboard.type("fff", { delay: 20 });
  await page.keyboard.press("Space");
  await page.keyboard.type("jjj", { delay: 20 });

  // 7 of 15 characters done, so index 7 (the second space) is now current.
  // If the space bar had not registered, typing would have stalled at "fff".
  const current = page.locator("p[aria-label^='Texto a escribir'] span").nth(7);
  await expect(current).toHaveClass(/bg-brand-100/);
});

test("errors do not advance and are counted in the results", async ({ page }) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText("Ejercicio 1 de 3")).toBeVisible();

  await page.keyboard.type("x", { delay: 20 }); // wrong on purpose
  await expect(page.getByText("Ejercicio 1 de 3")).toBeVisible();

  for (const text of EXERCISES_W1L1) {
    await page.keyboard.type(text, { delay: 20 });
  }
  await expect(page.getByText("Lección completada")).toBeVisible();
  const errores = page.locator("dt", { hasText: "Errores" }).locator("xpath=following-sibling::dd");
  await expect(errores).toHaveText("1");
});

test("completed lessons survive a reload (persistence)", async ({ page }) => {
  await page.goto("/leccion/w1-l1");
  await page.getByRole("button", { name: "Empezar a escribir" }).click();
  await expect(page.getByText("Ejercicio 1 de 3")).toBeVisible();
  for (const text of EXERCISES_W1L1) {
    await page.keyboard.type(text, { delay: 20 });
  }
  await expect(page.getByText("Lección completada")).toBeVisible();

  await page.goto("/curso");
  await page.reload();
  const firstNode = page.getByRole("link", {
    name: "Lección 1: Las anclas F y J",
  });
  await expect(firstNode.getByText("✓")).toBeVisible();
});
