// Combined, real-time notification counts (friend requests + group chat unread).
// Designed to be called directly from TabBar (or any page) so the badge
// stays correct no matter which screen is currently mounted - it does not
// depend on a parent page passing counts down as props.
import { useEffect, useState } from "react";
import { auth, db, rtdb } from "../firebase";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";

export function useNotificationCounts() {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadGroups, setUnreadGroups] = useState(0);
  const [groupIds, setGroupIds] = useState([]);

  // Track friend requests in real time
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = onSnapshot(collection(db, "friendRequests"), (snap) => {
      const incoming = snap.docs.filter(
        d => d.data().toUid === uid && d.data().status === "pending"
      );
      setPendingRequests(incoming.length);
    });

    return () => unsubscribe();
  }, []);

  // Track the user's current group ids (regular + open invite)
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = onSnapshot(doc(db, "users", uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const regular = data.groups || [];
      const openInvite = data.openInviteGroups || [];
      setGroupIds([...new Set([...regular, ...openInvite])]);
    });

    return () => unsubscribe();
  }, []);

  // Sum unread messages across all of the user's groups, using the same
  // lastSeen pattern as useUnreadMessages.
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || groupIds.length === 0) {
      setUnreadGroups(0);
      return;
    }

    const counts = {};
    const unsubscribes = groupIds.map(groupId => {
      const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
      return onValue(messagesRef, async (snap) => {
        const data = snap.val();
        if (!data) {
          counts[groupId] = 0;
          setUnreadGroups(Object.values(counts).reduce((a, b) => a + b, 0));
          return;
        }

        const lastSeenSnap = await getDoc(doc(db, "lastSeen", `${uid}_${groupId}`));
        const lastSeenTime = lastSeenSnap.exists() ? lastSeenSnap.data().timestamp : 0;

        const unread = Object.values(data).filter(
          msg => msg.senderId !== uid && (msg.timestamp || 0) > lastSeenTime
        ).length;

        counts[groupId] = unread;
        setUnreadGroups(Object.values(counts).reduce((a, b) => a + b, 0));
      });
    });

    return () => unsubscribes.forEach(u => u());
  }, [groupIds.join(",")]);

  return {
    pendingRequests,
    unreadGroups,
    totalCount: pendingRequests + unreadGroups,
  };
}