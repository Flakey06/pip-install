import { db, auth } from "../firebase";
import {
  collection, getDocs, doc, updateDoc,
  arrayUnion, arrayRemove, addDoc,
  getDoc, serverTimestamp, deleteDoc
} from "firebase/firestore";


const MAX_GROUPS_PER_PERSON = 7;
const MAX_MEMBERS_PER_GROUP = 6;
const MIN_MEMBERS_FOR_CHAT = 2;

const ADJECTIVES = ["Bold", "Curious", "Stellar", "Radical", "Cosmic", "Mighty", "Vivid", "Epic", "Mystic", "Chill", "Savage", "Hyper", "Legendary", "Golden", "Sonic"];
const NOUNS = ["Crew", "Squad", "Gang", "Pack", "Circle", "Club", "Collective", "Alliance", "Guild", "Tribe", "Posse", "Unit", "Syndicate", "League", "Faction"];


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

function normaliseInterest(interest) {
  return String(interest || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function interestDocId(interest) {
  return normaliseInterest(interest)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getInterestMeta(interest) {
  const id = interestDocId(interest);
  if (!id) return { interest: normaliseInterest(interest), categories: [] };

  const snap = await getDoc(doc(db, "interests", "master", "items", id));

  if (!snap.exists()) {
    return { interest: normaliseInterest(interest), categories: [] };
  }

  const data = snap.data();
  return {
    interest: normaliseInterest(data.interest || interest),
    categories: data.categories || [],
  };
}

async function getInterestMetaMap(interests) {
  const unique = [...new Set(interests.map(normaliseInterest).filter(Boolean))];

  const entries = await Promise.all(
    unique.map(async (interest) => [interest, await getInterestMeta(interest)])
  );

  return Object.fromEntries(entries);
}

function hasSharedCategory(a, b) {
  const categoriesA = a.categories || [];
  const categoriesB = b.categories || [];
  return categoriesA.some(category => categoriesB.includes(category));
}

function scoreInterestPair(userInterest, groupInterest, metaMap) {
  const userNorm = normaliseInterest(userInterest);
  const groupNorm = normaliseInterest(groupInterest);

  if (userNorm === groupNorm) {
    return { score: 2, exactMatch: true };
  }

  const userMeta = metaMap[userNorm] || { categories: [] };
  const groupMeta = metaMap[groupNorm] || { categories: [] };

  if (hasSharedCategory(userMeta, groupMeta)) {
    return { score: 1, exactMatch: false };
  }

  return { score: 0, exactMatch: false };
}

function scoreGroupForUser(userInterests, groupInterests, metaMap) {
  let totalScore = 0;
  let exactMatches = 0;

  for (const userInterest of userInterests) {
    let bestScoreForInterest = 0;
    let hasExactMatch = false;

    for (const groupInterest of groupInterests) {
      const result = scoreInterestPair(userInterest, groupInterest, metaMap);
      if (result.score > bestScoreForInterest) bestScoreForInterest = result.score;
      if (result.exactMatch) hasExactMatch = true;
    }

    totalScore += bestScoreForInterest;
    if (hasExactMatch) exactMatches++;
  }

  return { totalScore, exactMatches };
}


async function loadUserData(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  const userData = userDoc.data();
  return {
    currentGroups: userData.groups || [],
    maxGroups: userData.maxGroups || MAX_GROUPS_PER_PERSON,
  };
}

async function loadAvailableGroups(uid, currentGroups, extraFilter) {
  const groupsSnap = await getDocs(collection(db, "groups"));
  return groupsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(g =>
      (g.members || []).length < MAX_MEMBERS_PER_GROUP &&
      !(g.members || []).includes(uid) &&
      !currentGroups.includes(g.id) &&
      (extraFilter ? extraFilter(g) : true)
    );
}

async function findBestGroup(userInterests, allGroups, priority = "score") {
  const groupInterests = allGroups.flatMap(g =>
    (g.sharedInterests || []).map(normaliseInterest).filter(Boolean)
  );

  const metaMap = await getInterestMetaMap([...userInterests, ...groupInterests]);

  const scoredGroups = allGroups
    .map(group => {
      const sharedInterests = (group.sharedInterests || [])
        .map(normaliseInterest)
        .filter(Boolean);
      const score = scoreGroupForUser(userInterests, sharedInterests, metaMap);
      return { ...group, matchScore: score.totalScore, exactMatches: score.exactMatches };
    })
    .filter(group => group.matchScore > 0);

  if (scoredGroups.length === 0) return null;

  scoredGroups.sort((a, b) => {
    if (priority === "exact") {
      if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
      return b.matchScore - a.matchScore;
    }
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return b.exactMatches - a.exactMatches;
  });

  const best = scoredGroups[0];
  const tiedGroups = scoredGroups.filter(g =>
    g.matchScore === best.matchScore && g.exactMatches === best.exactMatches
  );

  return tiedGroups[Math.floor(Math.random() * tiedGroups.length)];
}

async function joinExistingGroup(uid, userInterests, group, extraFields = {}) {
  const joinedAt = Date.now();

  const exactShared = getCommonInterests(userInterests, group.sharedInterests || []);
  const updatedSharedInterests = exactShared.length > 0
    ? exactShared
    : (group.sharedInterests || []);

  await updateDoc(doc(db, "groups", group.id), {
    members: arrayUnion(uid),
    memberCount: (group.members || []).length + 1,
    sharedInterests: updatedSharedInterests,
    name: generateGroupName(updatedSharedInterests[0]),
    [`memberJoinedAt.${uid}`]: joinedAt,
  });

  await updateDoc(doc(db, "users", uid), {
    groups: arrayUnion(group.id),
  });

  return { success: true, groupId: group.id, ...extraFields };
}

// Creates a brand-new group when no suitable existing group was found.
async function createNewGroup(uid, userInterests) {
  const joinedAt = Date.now();

  const newGroup = await addDoc(collection(db, "groups"), {
    name: generateGroupName(userInterests[0]),
    members: [uid],
    memberCount: 1,
    sharedInterests: userInterests,
    createdAt: serverTimestamp(),
    type: "matched",
    historyForAll: false,
    memberJoinedAt: { [uid]: joinedAt },
  });

  await updateDoc(doc(db, "users", uid), {
    groups: arrayUnion(newGroup.id),
  });

  return { success: true, groupId: newGroup.id, waitingForMembers: true };
}


export async function joinStandardGroup(userProfile) {
  const uid = auth.currentUser.uid;
  const { currentGroups, maxGroups } = await loadUserData(uid);
  if (currentGroups.length >= maxGroups) return { success: false, reason: "max_groups" };

  const userInterests = (userProfile.interests || []).map(normaliseInterest).filter(Boolean);
  const allGroups = await loadAvailableGroups(uid, currentGroups);
  const group = await findBestGroup(userInterests, allGroups, "score");

  if (group) {
    return joinExistingGroup(uid, userInterests, group, {
      matchScore: group.matchScore,
      exactMatches: group.exactMatches,
    });
  }

  return createNewGroup(uid, userInterests);
}

export async function joinSimilarGroup(userProfile) {
  const uid = auth.currentUser.uid;
  const { currentGroups, maxGroups } = await loadUserData(uid);
  if (currentGroups.length >= maxGroups) return { success: false, reason: "max_groups" };

  const userInterests = (userProfile.interests || []).map(normaliseInterest).filter(Boolean);
  const allGroups = await loadAvailableGroups(uid, currentGroups);
  const group = await findBestGroup(userInterests, allGroups, "score");

  if (group) {
    return joinExistingGroup(uid, userInterests, group, {
      matchScore: group.matchScore,
      exactMatches: group.exactMatches,
    });
  }

  return createNewGroup(uid, userInterests);
}


export async function joinPreciseGroup(userProfile) {
  const uid = auth.currentUser.uid;
  const { currentGroups, maxGroups } = await loadUserData(uid);
  if (currentGroups.length >= maxGroups) return { success: false, reason: "max_groups" };

  const userInterests = (userProfile.interests || []).map(normaliseInterest).filter(Boolean);
  const allGroups = await loadAvailableGroups(uid, currentGroups);
  const group = await findBestGroup(userInterests, allGroups, "exact");

  if (group) {
    return joinExistingGroup(uid, userInterests, group, {
      matchScore: group.matchScore,
      exactMatches: group.exactMatches,
    });
  }

  return createNewGroup(uid, userInterests);
}

export async function joinFilteredGroup(userProfile, blacklistedInterests = []) {
  const uid = auth.currentUser.uid;
  const { currentGroups, maxGroups } = await loadUserData(uid);
  if (currentGroups.length >= maxGroups) return { success: false, reason: "max_groups" };

  const userInterests = (userProfile.interests || []).map(normaliseInterest).filter(Boolean);

  const blacklist = [
    ...(userProfile.blacklistedInterests || []),
    ...blacklistedInterests,
  ].map(normaliseInterest).filter(Boolean);

  const allGroups = await loadAvailableGroups(uid, currentGroups, (g) => {
    const groupInterests = (g.sharedInterests || []).map(normaliseInterest).filter(Boolean);
    return !groupInterests.some(interest => blacklist.includes(interest));
  });

  const group = await findBestGroup(userInterests, allGroups, "score");

  if (group) {
    return joinExistingGroup(uid, userInterests, group, {
      matchScore: group.matchScore,
      exactMatches: group.exactMatches,
    });
  }

  return createNewGroup(uid, userInterests);
}

export async function joinRandomGroup(userProfile) {
  const uid = auth.currentUser.uid;
  const { currentGroups, maxGroups } = await loadUserData(uid);
  if (currentGroups.length >= maxGroups) return { success: false, reason: "max_groups" };

  const userInterests = (userProfile.interests || []).map(normaliseInterest).filter(Boolean);
  const allGroups = await loadAvailableGroups(uid, currentGroups);

  if (allGroups.length > 0) {
    const group = allGroups[Math.floor(Math.random() * allGroups.length)];
    const joinedAt = Date.now();

    await updateDoc(doc(db, "groups", group.id), {
      members: arrayUnion(uid),
      memberCount: (group.members || []).length + 1,
      [`memberJoinedAt.${uid}`]: joinedAt,
    });

    await updateDoc(doc(db, "users", uid), {
      groups: arrayUnion(group.id),
    });

    return { success: true, groupId: group.id };
  }

  return createNewGroup(uid, userInterests);
}

export async function leaveGroup(groupId) {
  const uid = auth.currentUser.uid;

  const groupRef = doc(db, "groups", groupId);
  const userRef = doc(db, "users", uid);

  // Transfer admin rights if this user is admin
  const groupSnap = await getDoc(groupRef);
  if (groupSnap.exists()) {
    const data = groupSnap.data();
    if (data.adminId === uid) {
      const nextAdmin = (data.members || []).find(m => m !== uid);
      if (nextAdmin) {
        await updateDoc(groupRef, { adminId: nextAdmin });
      }
    }
  }

  // Automatic deletion if last member leaves group
  const groupSnap2 = await getDoc(groupRef);
  if (!groupSnap2.exists()) {
    await updateDoc(userRef, { groups: arrayRemove(groupId) });
    return { success: true, deleted: false, reason: "group_missing" };
  }

  const groupData = groupSnap2.data();
  const remainingMembers = (groupData.members || []).filter(id => id !== uid);

  if (remainingMembers.length === 0) {
    await deleteDoc(groupRef);
    await updateDoc(userRef, { groups: arrayRemove(groupId) });
    return { success: true, deleted: true };
  }

  await updateDoc(groupRef, { members: arrayRemove(uid) });
  await updateDoc(userRef, { groups: arrayRemove(groupId) });
  return { success: true };
}

export { MIN_MEMBERS_FOR_CHAT };