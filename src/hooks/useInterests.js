import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as tf from "@tensorflow/tfjs";

export const normalise = (str) =>
  String(str || "").toLowerCase().replace(/\s+/g, " ").trim();

export const uniqueInterests = (interests) =>
  [...new Set((interests || []).map(normalise).filter(Boolean))];

const DEFAULTS = [
  "ai", "hackathons", "gaming", "music", "sports", "art",
  "entrepreneurship", "design", "photography", "reading",
  "martial arts", "cooking", "coding", "dancing", "fitness",
  "travelling", "movies", "anime", "basketball", "swimming",
  "badminton", "tennis", "volleyball", "chess", "painting"
];

const MODEL_URL = "/models/interest-classifier/model.json";
const VOCAB_URL = "/models/interest-classifier/tfjs_numeric_interest_model/vocab.json";
const LABELS_URL = "/models/interest-classifier/tfjs_numeric_interest_model/category_labels.json";

const MAX_LEN = 8;
const OOV_ID = 1;
const THRESHOLD = 0.5;

let cachedModel = null;
let cachedVocab = null;
let cachedLabels = null;

function tokenize(text) {
  return normalise(text).match(/[a-z0-9]+/g) || [];
}

function interestDocId(interest) {
  return normalise(interest)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadClassifierAssets() {
  if (!cachedModel) {
    cachedModel = await tf.loadLayersModel(MODEL_URL);
  }

  if (!cachedVocab) {
    cachedVocab = await fetch(VOCAB_URL).then((res) => {
      if (!res.ok) throw new Error("Failed to load vocab.json");
      return res.json();
    });
  }

  if (!cachedLabels) {
    cachedLabels = await fetch(LABELS_URL).then((res) => {
      if (!res.ok) throw new Error("Failed to load category_labels.json");
      return res.json();
    });
  }

  return {
    model: cachedModel,
    vocab: cachedVocab,
    labels: cachedLabels,
  };
}

function encodeInterest(interest, vocab) {
  const ids = tokenize(interest)
    .map((token) => vocab[token] || OOV_ID)
    .slice(0, MAX_LEN);

  while (ids.length < MAX_LEN) ids.push(0);

  return ids;
}

export async function classifyInterest(interest) {
  const { model, vocab, labels } = await loadClassifierAssets();

  const input = tf.tensor2d(
    [encodeInterest(interest, vocab)],
    [1, MAX_LEN],
    "int32"
  );

  const prediction = model.predict(input);
  const rawScores = Array.from(await prediction.data());

  input.dispose();
  prediction.dispose();

  const results = labels
    .map((label, index) => ({
      label,
      score: rawScores[index] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  const selected = results.filter((item) => item.score >= THRESHOLD);

  return selected.length > 0 ? selected : results.slice(0, 1);
}

export async function saveInterestToDatabases(interest) {
  const norm = normalise(interest);

  if (!norm) {
    return {
      success: false,
      reason: "empty_interest",
    };
  }

  await setDoc(
    doc(db, "interests", "master"),
    {
      list: arrayUnion(norm),
    },
    { merge: true }
  );

  const classification = await classifyInterest(norm);

  await setDoc(
    doc(db, "interests", "master", "items", interestDocId(norm)),
    {
      interest: norm,
      categories: classification.map((item) => item.label),
      scores: Object.fromEntries(
        classification.map((item) => [item.label, item.score])
      ),
      source: "tfjs_numeric_model",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    success: true,
    interest: norm,
    classification,
  };
}

export async function saveInterestsToDatabases(interests) {
  const cleanInterests = uniqueInterests(interests);

  const results = await Promise.all(
    cleanInterests.map(interest => saveInterestToDatabases(interest))
  );

  const failedInterest = results.find(result => !result?.success);

  if (failedInterest) {
    return {
      success: false,
      failedInterest,
      interests: cleanInterests,
    };
  }

  return {
    success: true,
    interests: cleanInterests,
    results,
  };
}

export function useInterests() {
  const [allInterests, setAllInterests] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "interests", "master"));

        if (snap.exists()) {
          setAllInterests(uniqueInterests(snap.data().list || DEFAULTS));
        } else {
          const defaultInterests = uniqueInterests(DEFAULTS);

          await setDoc(doc(db, "interests", "master"), { list: defaultInterests });
          setAllInterests(defaultInterests);
        }
      } catch (err) {
        console.error("Failed to load interests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const addToMaster = async (interest) => {
    const result = await saveInterestToDatabases(interest);

    if (result.success) {
      setAllInterests((prev) => {
        return uniqueInterests([...prev, result.interest]).sort();
      });
    }

    return result;
  };

  return {
    allInterests,
    loading,
    addToMaster,
    classifyInterest,
  };
}

