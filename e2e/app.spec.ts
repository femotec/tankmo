import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function add(page: Page, liters = "20,00", cost = "40,00") {
  await page
    .getByRole("button", { name: "Tankvorgang hinzufügen", exact: true })
    .first()
    .click();
  await page.getByLabel("Liter", { exact: true }).fill(liters);
  await page.getByLabel("Gesamtpreis (€)").fill(cost);
  await expect(page.getByText("2,000 €/L", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
test("empty start, create, update, sort, chart filters, theme and persistent reload", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Willkommen bei Tankmo" }),
  ).toBeVisible();
  await add(page);
  await expect(
    page.getByText("40,00 €", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Tankbuch" })
    .click();
  await page.getByLabel("Sortierung").selectOption("lowest");
  await page.getByRole("button", { name: /Super E5.*40,00/ }).click();
  await expect(
    page.getByRole("heading", { name: "Dein Tankvorgang" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bearbeiten", exact: true }).click();
  await page.getByLabel("Gesamtpreis (€)").fill("50,00");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Tankbuch" })
    .click();
  await expect(page.getByLabel("Sortierung")).toHaveValue("lowest");
  await expect(
    page.getByRole("button", { name: /Super E5.*50,00/ }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Statistiken" })
    .click();
  await page.getByLabel("Jahr", { exact: true }).fill("2025");
  await page
    .getByRole("combobox", { name: "Monat", exact: true })
    .selectOption("0");
  await page.getByRole("button", { name: "30 Tage", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Deine Statistiken" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await page.getByRole("button", { name: "Dunkel", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("odometer CRUD and station assignment, CSV and backup export", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Kilometerstand eintragen", exact: true })
    .first()
    .click();
  await page.getByLabel("Kilometerstand", { exact: true }).fill("50000");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Kilometerstände" })
    .click();
  await expect(page.getByRole("button", { name: /50.000 km/ })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await page.getByRole("button", { name: "Hinzufügen", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Freie Tankstelle");
  await page.getByRole("button", { name: "Tankstelle speichern" }).click();
  await expect(
    page.locator("strong").filter({ hasText: "Freie Tankstelle" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Dashboard" })
    .click();
  await page
    .getByRole("button", { name: "Tankvorgang hinzufügen", exact: true })
    .first()
    .click();
  await page.getByLabel("Liter", { exact: true }).fill("25");
  await page.getByLabel("Gesamtpreis (€)").fill("54,25");
  await page
    .getByLabel("Tankstelle (optional)")
    .selectOption({ label: "Freie Tankstelle" });
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Vollständiges Backup exportieren/ })
    .click();
  expect((await download).suggestedFilename()).toMatch(/\.json$/);
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: /CSV exportieren/ }).click();
  expect((await csv).suggestedFilename()).toMatch(/\.csv$/);
});
test("offline cold reload, add, statistics, edit and persisted reload", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Willkommen bei Tankmo" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.close();
  page = await context.newPage();
  await page.goto('./');
  await expect(
    page.getByRole("heading", { name: "Willkommen bei Tankmo" }),
  ).toBeVisible();
  await add(page);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Statistiken" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Deine Statistiken" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Tankbuch" })
    .click();
  await page.getByRole("button", { name: /Super E5.*40,00/ }).click();
  await page.getByRole("button", { name: "Bearbeiten", exact: true }).click();
  await page.getByLabel("Gesamtpreis (€)").fill("48,00");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("48,00 €", { exact: true }).first(),
  ).toBeVisible();
});
test("backup preview, duplicate skip, replacement and CSV import refresh statistics", async ({
  page,
}) => {
  await page.goto("./");
  await add(page);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Vollständiges Backup exportieren/ })
    .click();
  const saved = await download;
  const contents = await readFile((await saved.path())!);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Backup wiederherstellen/ }).click();
  await (
    await chooser
  ).setFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: contents,
  });
  await expect(
    page.getByRole("heading", { name: "Import prüfen" }),
  ).toBeVisible();
  await expect(
    page.getByText(/1 vorhandene UUIDs, davon 0 abweichende/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import bestätigen" }).click();
  await expect(page.getByRole("status")).toContainText(
    "0 Datensätze importiert, 1 vorhandene übersprungen",
  );
  const b = JSON.parse(contents.toString());
  b.fuel[0].totalCost = "75.00";
  b.settings.appearance = "dark";
  const chooser2 = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Backup wiederherstellen/ }).click();
  await (
    await chooser2
  ).setFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(b)),
  });
  await page.getByLabel("Importverfahren").selectOption("replace");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Import bestätigen" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Dashboard" })
    .click();
  await expect(
    page.getByText("75,00 €", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /CSV exportieren/ }).click();
  const csv = await readFile((await (await csvDownload).path())!);
  const csvChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /CSV importieren/ }).click();
  await (
    await csvChooser
  ).setFiles({ name: "backup.csv", mimeType: "text/csv", buffer: csv });
  await expect(
    page.getByRole("heading", { name: "Import prüfen" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import bestätigen" }).click();
  await expect(page.getByRole("status")).toContainText("übersprungen");
});
test("delete confirmation, odometer edit and mobile layout in both orientations", async ({
  page,
}) => {
  await page.goto("./");
  await add(page);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Tankbuch" })
    .click();
  for (const sort of ["newest", "oldest", "highest", "lowest"])
    await page.getByLabel("Sortierung").selectOption(sort);
  await page.getByRole("button", { name: /Super E5.*40,00/ }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Löschen", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dein Tankvorgang" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Löschen", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dein Tankbuch beginnt hier" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Kilometerstände" })
    .click();
  await page
    .getByRole("button", { name: "Kilometerstand eintragen", exact: true })
    .first()
    .click();
  await page.getByLabel("Kilometerstand", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.getByRole("button", { name: /1.000 km/ }).click();
  await page.getByLabel("Kilometerstand", { exact: true }).fill("1200");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("button", { name: /1.200 km/ })).toBeVisible();
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 844, height: 390 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("capture mobile light, mobile dark and desktop screens with no page errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Willkommen bei Tankmo" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard-light.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await page.getByRole("button", { name: "Dunkel", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Dashboard" })
    .click();
  await page.screenshot({
    path: testInfo.outputPath("dashboard-dark.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("dashboard-desktop.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("manifest paths, Apple icon and a valid consumption chart", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Willkommen bei Tankmo" }),
  ).toBeVisible();
  const manifestURL = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const manifest = await (await page.request.get(manifestURL!)).json();
  expect(manifest.name).toBe("Tankmo");
  expect(manifest.scope).toBe(process.env.VITE_BASE_PATH || "/");
  expect(manifest.start_url).toBe(manifest.scope);
  for (const icon of manifest.icons) {
    const response = await page.request.get(
      new URL(icon.src, new URL(manifestURL!, page.url())).toString(),
    );
    expect(response.ok()).toBe(true);
  }
  const appleURL = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href");
  const apple = await (await page.request.get(appleURL!)).body();
  expect(apple.readUInt32BE(16)).toBe(180);
  expect(apple.readUInt32BE(20)).toBe(180);
  const make = (
    date: string,
    odometer: number,
    liters: string,
    totalCost: string,
    full: boolean,
  ) => ({
    id: crypto.randomUUID(),
    date,
    odometer,
    liters,
    totalCost,
    isFullTank: full,
    fuelType: "superE5",
    createdAt: date,
    updatedAt: date,
  });
  const backup = {
    schemaVersion: 1,
    appVersion: "1.0.0",
    createdAt: new Date().toISOString(),
    fuel: [
      make("2026-01-01T12:00:00.000Z", 50000, "50.000", "100.00", true),
      make("2026-01-02T12:00:00.000Z", 50300, "15.000", "25.04", false),
      make("2026-01-03T12:00:00.000Z", 50600, "21.000", "40.00", true),
    ],
    odometer: [],
    stations: [],
    settings: {
      id: "main",
      appearance: "auto",
      preferredTankbookSort: "newest",
      defaultFuelType: "superE5",
    },
  };
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Backup wiederherstellen/ }).click();
  await (
    await chooser
  ).setFiles({
    name: "full-tanks.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: "Import bestätigen" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Statistiken" })
    .click();
  await expect(
    page
      .locator("main > div:not([hidden])")
      .getByText("6,0 L/100 km", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator("main > div:not([hidden])")
      .getByText("10,84 €", { exact: true })
      .first(),
  ).toBeVisible();
});
