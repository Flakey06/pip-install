// file use: track who viewed your profile
import { db, auth } from "../firebase";
import { doc, setDoc, collection, getDocs, query, where, getDoc } from "firebase/firestore";

export async function recordProfileView(viewedUid) {
  const uid = auth.currentUser?.uid;
  if (!uid || uid === viewedUid) return;
  try {
    await setDoc(doc(db, "profileViews", `${uid}_${viewedUid}`), {
      viewerUid: uid,
      viewedUid: viewedUid,
      viewedAt: new Date()
    });
  } catch (e) {
    console.error("recordProfileView error:", e);
  }
}

export async function getViewerProfiles(uid) {
  try {
    const snap = await getDocs(query(
      collection(db, "profileViews"),
      where("viewedUid", "==", uid)
    ));
    const views = snap.docs.map(d => d.data());
    // Sort client-side instead of using orderBy (avoids needing composite index)
    views.sort((a, b) => (b.viewedAt?.toMillis?.() || 0) - (a.viewedAt?.toMillis?.() || 0));
    const uniqueViewers = [...new Set(views.map(v => v.viewerUid))].slice(0, 10);
    const profiles = await Promise.all(
      uniqueViewers.map(viewerUid => getDoc(doc(db, "users", viewerUid)))
    );
    return profiles.filter(d => d.exists()).map(d => ({ uid: d.id, ...d.data() }));
  } catch (e) {
    console.error("getViewerProfiles error:", e);
    return [];
  }
}
