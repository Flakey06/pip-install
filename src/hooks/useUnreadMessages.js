import { useState, useEffect } from "react";
import { auth, db, rtdb } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";

export function useUnreadMessages(groupIds) {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!groupIds || groupIds.length === 0) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribes = [];

    groupIds.forEach(groupId => {
      const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
      const unsubscribe = onValue(messagesRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setUnreadCounts(prev => ({ ...prev, [groupId]: 0 }));
          return;
        }

        // Get last seen timestamp for this group
        const lastSeenRef = doc(db, "lastSeen", `${uid}_${groupId}`);
        const lastSeenSnap = await getDoc(lastSeenRef);
        const lastSeenTime = lastSeenSnap.exists()
          ? lastSeenSnap.data().timestamp
          : 0;

        // Count messages after lastSeen that aren't from me
        const messages = Object.values(data);
        const unread = messages.filter(msg =>
          msg.senderId !== uid &&
          (msg.timestamp || 0) > lastSeenTime
        ).length;

        setUnreadCounts(prev => {
          const updated = { ...prev, [groupId]: unread };
          const total = Object.values(updated).reduce((a, b) => a + b, 0);
          setTotalUnread(total);
          return updated;
        });
      });

      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(u => u());
  }, [groupIds?.join(",")]);

  return { unreadCounts, totalUnread };
}

// Call this when user opens a group chat
export async function markGroupAsRead(groupId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const lastSeenRef = doc(db, "lastSeen", `${uid}_${groupId}`);
  await setDoc(lastSeenRef, {
    timestamp: Date.now(),
    uid,
    groupId
  });
}
