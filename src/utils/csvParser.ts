import Papa from "papaparse";
import { Transaction } from "../types";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 1_000;

function parseMoney(value: unknown, field: string): number {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const negative = raw.startsWith("(") && raw.endsWith(")");
  const normalized = raw.replace(/[,$()\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) throw new Error(`${field} contains an invalid amount.`);
  const amount = Number(normalized);
  return negative ? -Math.abs(amount) : amount;
}

function find(headers: string[], names: string[]): string | undefined {
  return headers.find((header) => names.some((name) => header.toLowerCase().trim() === name));
}

function validDate(value: unknown, row: number): string {
  const raw = String(value ?? "").trim();
  const time = Date.parse(raw);
  if (!raw || !Number.isFinite(time)) throw new Error(`Row ${row} has an invalid date.`);
  return new Date(time).toISOString().slice(0, 10);
}

export async function parseCSV(file: File): Promise<Transaction[]> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("CSV files are limited to 5 MB.");
  const content = await file.text();
  const result = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: "greedy" });
  if (result.errors.length) throw new Error(`CSV parse error on row ${result.errors[0].row ?? "unknown"}: ${result.errors[0].message}`);
  if (!result.meta.fields?.length || result.data.length === 0) throw new Error("CSV must contain a header and at least one row.");
  if (result.data.length > MAX_IMPORT_ROWS) throw new Error(`CSV imports are limited to ${MAX_IMPORT_ROWS} rows per governed batch.`);
  const headers = result.meta.fields;
  const date = find(headers, ["date", "transaction date", "posted date", "posting date"]);
  const description = find(headers, ["description", "memo", "details", "narrative"]);
  const amount = find(headers, ["amount", "transaction amount", "value"]);
  const debit = find(headers, ["debit", "debit amount", "withdrawal"]);
  const credit = find(headers, ["credit", "credit amount", "deposit"]);
  const category = find(headers, ["category", "transaction category"]);
  const merchant = find(headers, ["merchant", "merchant name", "payee"]);
  const reference = find(headers, ["transaction id", "id", "reference", "payment ref id / check no"]);
  if (!date || !description || (!amount && !(debit && credit))) throw new Error("CSV requires date, description, and either amount or debit/credit columns.");
  return result.data.map((row, index) => {
    const debitAmount = debit ? Math.abs(parseMoney(row[debit], `Row ${index + 2} debit`)) : 0;
    const creditAmount = credit ? Math.abs(parseMoney(row[credit], `Row ${index + 2} credit`)) : 0;
    if (debitAmount && creditAmount) throw new Error(`Row ${index + 2} cannot contain both debit and credit values.`);
    const parsedAmount = amount ? parseMoney(row[amount], `Row ${index + 2} amount`) : creditAmount - debitAmount;
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) throw new Error(`Row ${index + 2} must contain a non-zero amount.`);
    return {
      id: String(row[reference || ""] || `row-${index + 2}`), date: validDate(row[date], index + 2), amount: parsedAmount,
      description: String(row[description] || "").trim(), category: String(row[category || ""] || "Uncategorized").trim(),
      type: parsedAmount > 0 ? "inflow" : "outflow", merchant: merchant ? String(row[merchant] || "").trim() : undefined,
      paymentRef: reference ? String(row[reference] || "").trim() : undefined,
    };
  });
}
