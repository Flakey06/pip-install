import { db, auth } from "../firebase";
import {
  collection, getDocs, doc, updateDoc,
  arrayUnion, arrayRemove, addDoc,
  getDoc, serverTimestamp
} from "firebase/firestore";

const MAX_GROUPS_PER_PERSON = 7;
const MAX_MEMBERS_PER_GROUP = 6;
const MIN_MEMBERS_FOR_CHAT = 2;

export const getCommonInterests = (a, b) => {
  const normA = a.map(i => i.toLowerCase().trim());
  const normB = b.map(i => i.toLowerCase().trim());
  return normA.filter(i => normB.includes(i));
};

export async function joinRandomGroup(userProfile) {
  const uid = auth.currentUser.uid;

  const userDoc = await getDoc(doc(db, "users", uid));
  const userData = userDoc.data();
  const currentGroups = userData.groups || [];

  if (currentGroups.length >= MAX_GROUPS_PER_PERSON) {
    return { success: false, reason: "max_groups" };
  }

  const userInterests = (userProfile.interests || []).map(i => i.toLowerCase().trim());

  // Fetch all groups
  const groupsSnap = await getDocs(collection(db, "groups"));
  const allGroups = groupsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(g =>
      (g.members || []).length < MAX_MEMBERS_PER_GROUP &&
      !(g.members || []).includes(uid) &&
      !currentGroups.includes(g.id)
    );

  // Find compatible groups with at least 1 common interest
  const compatible = allGroups.filter(g => {
    const groupInterests = (g.sharedInterests || []).map(i => i.toLowerCase().trim());
    const common = userInterests.filter(i => groupInterests.includes(i));
    return common.length >= 1;
  });

  if (compatible.length > 0) {
    // Pick random compatible group
    const group = compatible[Math.floor(Math.random() * compatible.length)];

    // Recalculate shared interests with new member
    const groupInterests = (group.sharedInterests || []).map(i => i.toLowerCase().trim());
    const newShared = userInterests.filter(i => groupInterests.includes(i));


    await updateDoc(doc(db, "groups", group.id), {
      members: arrayUnion(uid),
      memberCount: (group.members || []).length + 1,
      sharedInterests: newShared,
      name: `${newShared[0] || "general"} group`
    });



    await updateDoc(doc(db, "users", uid), {
      groups: arrayUnion(group.id)
    });

    return { success: true, groupId: group.id };
  }

  // No compatible group — create new one with ALL user interests as shared
  const newGroup = await addDoc(collection(db, "groups"), {
    name: `${userInterests[0] || "general"} group`,
    members: [uid],
    memberCount: 1,
    sharedInterests: userInterests,
    createdAt: serverTimestamp(),
    type: "matched"
  });

  await updateDoc(doc(db, "users", uid), {
    groups: arrayUnion(newGroup.id)
  });

  return { success: true, groupId: newGroup.id, waitingForMembers: true };
}

export async function leaveGroup(groupId) {
  const uid = auth.currentUser.uid;

  await updateDoc(doc(db, "groups", groupId), {
    members: arrayRemove(uid),
  });

  await updateDoc(doc(db, "users", uid), {
    groups: arrayRemove(groupId)
  });

  return { success: true };
}

export { MIN_MEMBERS_FOR_CHAT };
