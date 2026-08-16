import { test, expect } from "@playwright/test";

test("naves: typing works right after pressing Despegar, no field click", async ({
  page,
}) => {
  await page.goto("/juegos/naves");
  await page.getByRole("button", { name: "Despegar" }).click();

  // Never click or focus the play field: read the first enemy word and type it.
  const chip = page.locator("div[role='application'] p.font-mono").first();
  await expect(chip).toBeVisible({ timeout: 10_000 });
  const word = (await chip.innerText()).trim();

  await page.keyboard.type(word, { delay: 30 });

  await expect(page.getByText(/ pts$/)).not.toHaveText("0 pts");
});

test("magia: typing works right after opening the sky, no field click", async ({
  page,
}) => {
  await page.goto("/juegos/magia");
  await page.getByRole("button", { name: "Abrir el cielo" }).click();

  const chip = page.locator("div[role='application'] p.font-mono").first();
  await expect(chip).toBeVisible({ timeout: 10_000 });
  const word = (await chip.innerText()).trim();

  await page.keyboard.type(word, { delay: 30 });

  await expect(page.getByText(/ pts$/)).not.toHaveText("0 pts");
});
