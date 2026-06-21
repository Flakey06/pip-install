import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, setDoc, increment, arrayUnion, serverTimestamp } from "firebase/firestore";

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
};

// Ensure credits field exists on user doc
async function ensureCreditsField(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.credits === undefined) {
    await updateDoc(doc(db, "users", uid), {
      credits: 0,
      maxGroups: 5,
      creditHistory: []
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
  if (!snap.exists()) return 5;
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
      const today = new Date();
      if (lastLogin.toDateString() === today.toDateString()) return 0;
      await updateDoc(doc(db, "users", uid), {
        credits: increment(amount),
        lastLoginReward: serverTimestamp(),
        creditHistory: arrayUnion({ reason, amount, at: Date.now() })
      });
      console.log(`Awarded ${amount} credits for ${reason}`);
      return amount;
    }

    await updateDoc(doc(db, "users", uid), {
      credits: increment(amount),
      creditHistory: arrayUnion({ reason, amount, at: Date.now() })
    });
    console.log(`Awarded ${amount} credits for ${reason}`);
    return amount;
  } catch (err) {
    console.error("AwardCredits failed:", err);
    return 0;
  }
}

export async function spendCredits(cost, slot) {
  const uid = auth.currentUser?.uid;
  if (!uid) return { success: false };
  try {
    await ensureCreditsField(uid);
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.data();
    const current = typeof data?.credits === "number" ? data.credits : 0;
    const currentMax = data?.maxGroups || 5;
    if (currentMax >= slot) return { success: false, reason: "already_unlocked" };
    if (current < cost) return { success: false, reason: "not_enough" };
    await updateDoc(doc(db, "users", uid), {
      credits: increment(-cost),
      maxGroups: slot,
      creditHistory: arrayUnion({ reason: `unlock_slot_${slot}`, amount: -cost, at: Date.now() })
    });
    return { success: true };
  } catch (err) {
    console.error("SpendCredits failed:", err);
    return { success: false, reason: "error" };
  }
}
