import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import XLSX from "xlsx";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const serviceAccount = JSON.parse(
  await readFile(resolve("serviceAccountKey.json"), "utf8")
);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const excelPath = resolve("interest sorting algo (not integrated)", "interests.xlsx");

const categoryColumns = [
  "sports",
  "tech",
  "creatives",
  "games",
  "innovation",
  "lifestyle",
  "business",
  "science",
];

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function interestDocId(interest) {
  return normalise(interest)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames.includes("Sheet1")
  ? "Sheet1"
  : workbook.SheetNames[0];

const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

const rowMap = new Map();

for (const row of rows) {
  const interest = normalise(row.Interest || row.interest);
  if (!interest) continue;

  const scores = {};
  const categories = [];

  for (const category of categoryColumns) {
    const score = Number(row[category]) === 1 ? 1 : 0;
    scores[category] = score;
    if (score === 1) categories.push(category);
  }

  rowMap.set(interest, {
    interest,
    categories,
    scores,
  });
}

const cleanedRows = [...rowMap.values()].sort((a, b) =>
  a.interest.localeCompare(b.interest)
);

const uniqueInterests = cleanedRows.map((row) => row.interest);

await db.doc("interests/master").set(
  {
    list: uniqueInterests,
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

let batch = db.batch();
let pendingWrites = 0;
let itemCount = 0;

for (const row of cleanedRows) {
  const ref = db.doc(`interests/master/items/${interestDocId(row.interest)}`);

  batch.set(
    ref,
    {
      interest: row.interest,
      categories: row.categories,
      scores: row.scores,
      source: "excel_upload",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  pendingWrites += 1;
  itemCount += 1;

  if (pendingWrites === 450) {
    await batch.commit();
    batch = db.batch();
    pendingWrites = 0;
  }
}

if (pendingWrites > 0) {
  await batch.commit();
}

console.log(`Read ${rows.length} row(s) from ${sheetName}.`);
console.log(`Uploaded ${uniqueInterests.length} unique interests to interests/master.list.`);
console.log(`Uploaded ${itemCount} classification item(s) to interests/master/items.`);