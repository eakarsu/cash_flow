import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const operatorToken = "test-operator-token";
const providerSecret = "test-provider-secret";

test("licensed source ingestion, operator login, governed manual entry, and controls are live", async ({ page, request }) => {
  const source = await request.post("/api/v1/source-accounts", {
    headers: { authorization: `Bearer ${operatorToken}`, "x-actor-id": "e2e-setup" },
    data: { provider: "licensed-bank", externalAccountId: "e2e-bank", displayName: "E2E operating cash", currency: "USD", custodyClass: "bank", licenseReference: "e2e-license" },
  });
  expect(source.status()).toBe(201);
  const now = new Date().toISOString();
  const ingestionBody = { sourceAccountId: (await source.json()).id, idempotencyKey: "e2e-provider-batch", sourceAsOf: now,
    entries: [{ externalId: "e2e-provider-txn", occurredAt: now, sourceTimestamp: now, currency: "USD", amountMinor: 250_000_00, description: "Licensed provider opening balance", metadata: { category: "Opening balance" } }] };
  const raw = JSON.stringify(ingestionBody);
  const signature = createHmac("sha256", providerSecret).update(`${now}.${raw}`).digest("hex");
  const ingestion = await request.post("/api/v1/provider-ingestions/licensed-bank", { headers: { "content-type": "application/json", "x-cashflow-timestamp": now, "x-cashflow-signature": signature }, data: raw });
  expect(ingestion.status()).toBe(202);

  await page.goto("/login");
  await page.getByLabel("Email").fill("operator@example.test");
  await page.getByLabel("Password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Licensed provider opening balance")).toBeVisible();

  await page.goto("/transactions/add");
  await page.getByLabel("Date").fill(new Date().toISOString().slice(0, 10));
  await page.getByLabel("Description").fill("Governed customer receipt");
  await page.getByLabel("Type").selectOption("inflow");
  await page.getByLabel("Amount").fill("125.50");
  await page.getByLabel("Category").fill("Customer receipts");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByText("Governed customer receipt")).toBeVisible();

  await page.goto("/operations");
  await expect(page.getByRole("heading", { name: "Governed operations" })).toBeVisible();
  await expect(page.getByText("Kill switch: inactive")).toBeVisible();
  await expect(page.getByText("Paper-only", { exact: false }).first()).toBeVisible();
});
