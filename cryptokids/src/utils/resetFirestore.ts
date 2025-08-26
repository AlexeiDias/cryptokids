// src/utils/resetFirestore.ts
import { db } from "../services/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const clearCollection = async (name: string) => {
  const snap = await getDocs(collection(db, name));
  for (const d of snap.docs) {
    await deleteDoc(doc(db, name, d.id));
  }
  console.log(`🔥 Cleared ${name}`);
};

export const resetFirestore = async () => {
  await clearCollection("users");
  await clearCollection("balances");
  await clearCollection("chores");
  await clearCollection("storeItems");
  await clearCollection("fines");
  await clearCollection("transactions");

  console.log("✅ Firestore reset (no seeding)");
};
