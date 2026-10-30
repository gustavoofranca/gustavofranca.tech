import { expect, type Locator } from "@playwright/test";
import { currentMonthUtc, isFutureMonth } from "@/lib/dates";

// O rótulo de previsão depende do mês do build. O teste roda logo depois do build,
// então o mês corrente aqui é o mesmo: a expectativa sai do término mostrado na página.
export async function expectExpectedLabel(item: Locator, label: string) {
  await expect(item).toHaveCount(1);
  const end = await item.locator("time").last().getAttribute("datetime");
  expect(end).toMatch(/^\d{4}-\d{2}$/);
  if (isFutureMonth(end, currentMonthUtc())) {
    await expect(item).toContainText(label);
  } else {
    await expect(item).not.toContainText(label);
  }
}
