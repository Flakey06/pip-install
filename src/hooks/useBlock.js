// file use: block/unblock users, check if blocked
import { db, auth } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

export async function blockUser(targetUid) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, "blocks", `${uid}_${targetUid}`), {
    blockerUid: uid,
    blockedUid: targetUid,
    createdAt: new Date()
  });
}

export async function unblockUser(targetUid) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await deleteDoc(doc(db, "blocks", `${uid}_${targetUid}`));
}

// Did I block targetUid?
export async function isBlocked(targetUid) {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;

  try {
    const snap = await getDoc(doc(db, "blocks", `${uid}_${targetUid}`));
    return snap.exists();
  } catch (error) {
    console.error("isBlocked error:", error);
    return false;
  }
}

// Did otherUid block ME? This is the missing check that let blocked users
// keep messaging the person who blocked them - isBlocked() only ever looks
// at blocks the *current* user made, never blocks made against them.
export async function isBlockedBy(otherUid) {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;

  try {
    const snap = await getDoc(doc(db, "blocks", `${otherUid}_${uid}`));
    return snap.exists();
  } catch (error) {
    console.error("isBlockedBy error:", error);
    return false;
  }
}

export async function getBlockedUsers() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, "blocks"), where("blockerUid", "==", uid)));
  return snap.docs.map(d => d.data().blockedUid);
}