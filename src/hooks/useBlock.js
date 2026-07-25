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

export async function isBlocked(targetUid) {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snap = await getDoc(doc(db, "blocks", `${uid}_${targetUid}`));
  return snap.exists();
}

export async function getBlockedUsers() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, "blocks"), where("blockerUid", "==", uid)));
  return snap.docs.map(d => d.data().blockedUid);
}
