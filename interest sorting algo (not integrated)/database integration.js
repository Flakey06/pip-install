import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import XLSX from "xlsx";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccountPath = resolve(__dirname, "../serviceAccountKey.json");
const excelPath = resolve(__dirname, "./interests.xlsx");

const serviceAccount = JSON.parse(
  await readFile(serviceAccountPath, "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

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

function makeDocId(interest) {
  return interest
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets["Sheet1"];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

const cleanedRows = rows
  .map((row) => {
    const interest = normalise(row.Interest);

    const scores = {};
    const categories = [];

    for (const category of categoryColumns) {
      const score = Number(row[category]) === 1 ? 1 : 0;
      scores[category] = score;
      if (score === 1) categories.push(category);
    }

    return { interest, categories, scores };
  })
  .filter((row) => row.interest);

const uniqueInterests = [...new Set(cleanedRows.map((row) => row.interest))].sort();

await db.doc("interests/master").set(
  {
    list: uniqueInterests,
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

let batch = db.batch();
let writeCount = 0;

for (const row of cleanedRows) {
  const ref = db
    .collection("interestClassifications")
    .doc(makeDocId(row.interest));

  batch.set(ref, {
    interest: row.interest,
    categories: row.categories,
    scores: row.scores,
    updatedAt: FieldValue.serverTimestamp(),
  });

  writeCount++;

  if (writeCount % 450 === 0) {
    await batch.commit();
    batch = db.batch();
  }
}

await batch.commit();

console.log(`Uploaded ${uniqueInterests.length} interests to interests/master.`);
console.log(`Uploaded ${cleanedRows.length} documents to interestClassifications.`);
