// file use: Matching algorithm, can join/leave groups, also can generate group names

import { db, auth } from "../firebase";
import {
  collection, getDocs, doc, updateDoc,
  arrayUnion, arrayRemove, addDoc,
  getDoc, serverTimestamp
} from "firebase/firestore";

const MAX_GROUPS_PER_PERSON = 5;
const MAX_MEMBERS_PER_GROUP = 6;
const MIN_MEMBERS_FOR_CHAT = 2;

const ADJECTIVES = ["Bold","Curious","Stellar","Radical","Cosmic","Mighty","Vivid","Epic","Mystic","Chill","Savage","Hyper","Legendary","Golden","Sonic","Fierce","Slick","Wild","Sharp","Elite"];
const NOUNS = ["Crew","Squad","Gang","Pack","Circle","Club","Collective","Alliance","Guild","Tribe","Posse","Unit","Syndicate","League","Faction","Mob","Clique","Bunch","Band","Wolves"];

export function generateGroupName(interest) {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const topic = interest ? interest.charAt(0).toUpperCase() + interest.slice(1) : "General";
  return `${topic} ${adj} ${noun}`;
}

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
  const maxGroups = userData.maxGroups || MAX_GROUPS_PER_PERSON;
  
  if (currentGroups.length >= maxGroups) {
    return { success: false, reason: "max_groups" };
  }


  

  const userInterests = (userProfile.interests || []).map(i => i.toLowerCase().trim());
  const groupsSnap = await getDocs(collection(db, "groups"));
  const allGroups = groupsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(g =>
      (g.members || []).length < MAX_MEMBERS_PER_GROUP &&
      !(g.members || []).includes(uid) &&
      !currentGroups.includes(g.id)
    );

  const compatible = allGroups.filter(g => {
    const groupInterests = (g.sharedInterests || []).map(i => i.toLowerCase().trim());
    return userInterests.filter(i => groupInterests.includes(i)).length >= 1;
  });

  if (compatible.length > 0) {
    const group = compatible[Math.floor(Math.random() * compatible.length)];
    const groupInterests = (group.sharedInterests || []).map(i => i.toLowerCase().trim());
    const newShared = userInterests.filter(i => groupInterests.includes(i));
    const joinedAt = Date.now();

    await updateDoc(doc(db, "groups", group.id), {
      members: arrayUnion(uid),
      memberCount: (group.members || []).length + 1,
      sharedInterests: newShared,
      name: generateGroupName(newShared[0]),
      [`memberJoinedAt.${uid}`]: joinedAt
    });

    await updateDoc(doc(db, "users", uid), { groups: arrayUnion(group.id) });
    return { success: true, groupId: group.id };
  }

  const joinedAt = Date.now();
  const newGroup = await addDoc(collection(db, "groups"), {
    name: generateGroupName(userInterests[0]),
    members: [uid],
    memberCount: 1,
    sharedInterests: userInterests,
    createdAt: serverTimestamp(),
    type: "matched",
    historyForAll: false,
    memberJoinedAt: { [uid]: joinedAt }
  });

  await updateDoc(doc(db, "users", uid), { groups: arrayUnion(newGroup.id) });
  return { success: true, groupId: newGroup.id, waitingForMembers: true };
}

export async function leaveGroup(groupId) {
  const uid = auth.currentUser.uid;
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayRemove(uid)
  });
  await updateDoc(doc(db, "users", uid), {
    groups: arrayRemove(groupId)
  });
  return { success: true };
}

export { MIN_MEMBERS_FOR_CHAT };
