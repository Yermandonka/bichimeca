import { test, expect } from "@playwright/test";

test("modo texto: full run with accents and punctuation feeds the ranking", async ({
  page,
}) => {
  await page.goto("/texto");
  const target = page.locator("p[aria-label^='Texto a escribir']");
  await expect(target).toBeVisible();

  const label = await target.getAttribute("aria-label");
  const text = label!.replace("Texto a escribir: ", "");

  await page.keyboard.type(text, { delay: 5 });

  await expect(page.getByText("Texto completado")).toBeVisible();
  const ranking = page.locator("table tbody tr");
  await expect(ranking).toHaveCount(1);
  await expect(ranking.first()).toContainText("🏆");

  // The run survives a reload (persistence into the progress store).
  await page.reload();
  await expect(page.locator("table tbody tr")).toHaveCount(1);
});
