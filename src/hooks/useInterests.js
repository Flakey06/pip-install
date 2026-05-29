import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";

export const normalise = (str) =>
  str.toLowerCase().replace(/\s+/g, " ").trim();

const DEFAULTS = [
  "ai", "hackathons", "gaming", "music", "sports", "art",
  "entrepreneurship", "design", "photography", "reading",
  "martial arts", "cooking", "coding", "dancing", "fitness",
  "travelling", "movies", "anime", "basketball", "swimming",
  "badminton", "tennis", "volleyball", "chess", "painting"
];

export function useInterests() {
  const [allInterests, setAllInterests] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "interests", "master"));
        if (snap.exists()) {
          setAllInterests(snap.data().list || DEFAULTS);
        } else {
          await setDoc(doc(db, "interests", "master"), { list: DEFAULTS });
          setAllInterests(DEFAULTS);
        }
      } catch (err) {
        console.error("Failed to load interests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const addToMaster = async (interest) => {
    const norm = normalise(interest);
    if (!norm || allInterests.includes(norm)) return;
    try {
      await updateDoc(doc(db, "interests", "master"), { list: arrayUnion(norm) });
      setAllInterests(prev => [...prev, norm].sort());
    } catch (err) {
      console.error("Failed to add interest:", err);
    }
  };

  return { allInterests, loading, addToMaster };
}