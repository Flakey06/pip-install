// file use: earn, spend, fetch coin balance, unlock group slots and premium features
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, increment, arrayUnion, serverTimestamp } from "firebase/firestore";

export const CREDIT_REWARDS = {
  wyr_vote: 2,
  trivia_correct: 10,
  trivia_play: 3,
  daily_login: 5,
};

export const UNLOCK_COSTS = {
  slot_6: 50,
  slot_7: 100,
  slot_8: 200,
  premium_ring: 50,
  gold_ring: 100,
  rainbow_ring: 200,
  change_username: 30,
  badge_star: 75,
  badge_fire: 75,
  badge_crown: 150,
};

async function ensureCreditsField(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.credits === undefined) {
    await updateDoc(doc(db, "users", uid), {
      credits: 0, maxGroups: 5, creditHistory: []
    });
  }
}

export async function getCredits() {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return 0;
  const val = snap.data()?.credits;
  return typeof val === "number" ? val : 0;
}

export async function getMaxGroups() {
  const uid = auth.currentUser?.uid;
  if (!uid) return 5;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.data()?.maxGroups || 5;
}

export async function awardCredits(reason) {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;
  const amount = CREDIT_REWARDS[reason] || 0;
  if (!amount) return 0;
  try {
    await ensureCreditsField(uid);
    if (reason === "daily_login") {
      const snap = await getDoc(doc(db, "users", uid));
      const lastLogin = snap.data()?.lastLoginReward?.toDate?.() || new Date(0);
      if (lastLogin.toDateString() === new Date().toDateString()) return 0;
      await updateDoc(doc(db, "users", uid), {
        credits: increment(amount),
        lastLoginReward: serverTimestamp(),
        creditHistory: arrayUnion({ reason, amount, at: Date.now() })
      });
      return amount;
    }
    await updateDoc(doc(db, "users", uid), {
      credits: increment(amount),
      creditHistory: arrayUnion({ reason, amount, at: Date.now() })
    });
    return amount;
  } catch (err) {
    console.error("awardCredits failed:", err);
    return 0;
  }
}

export async function spendCredits(cost, item) {
  const uid = auth.currentUser?.uid;
  if (!uid) return { success: false };
  try {
    await ensureCreditsField(uid);
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.data();
    const current = typeof data?.credits === "number" ? data.credits : 0;

    // Check slot unlock
    if (item.startsWith("slot_")) {
      const slot = parseInt(item.split("_")[1]);
      if ((data?.maxGroups || 5) >= slot) return { success: false, reason: "already_unlocked" };
      if (current < cost) return { success: false, reason: "not_enough" };
      await updateDoc(doc(db, "users", uid), {
        credits: increment(-cost),
        maxGroups: slot,
        creditHistory: arrayUnion({ reason: `unlock_${item}`, amount: -cost, at: Date.now() })
      });
      return { success: true };
    }

    // Check ring/badge/username already owned
    if (data?.purchases?.includes(item)) return { success: false, reason: "already_owned" };
    if (current < cost) return { success: false, reason: "not_enough" };

    const updateData = {
      credits: increment(-cost),
      purchases: arrayUnion(item),
      creditHistory: arrayUnion({ reason: `buy_${item}`, amount: -cost, at: Date.now() })
    };

    // Apply cosmetic immediately
    if (item.includes("ring")) updateData.profileRing = item;
    if (item.includes("badge")) updateData.profileBadge = item;

    await updateDoc(doc(db, "users", uid), updateData);
    return { success: true };
  } catch (err) {
    console.error("spendCredits failed:", err);
    return { success: false, reason: "error" };
  }
}
