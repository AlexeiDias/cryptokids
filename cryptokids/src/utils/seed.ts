import { addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";


export const seedDemoData = async () => {
  const familyId = "demo-family"; // must match Dashboard default

  // --- Users (parent + children) ---
  const parent = await addDoc(collection(db, "users"), {
    name: "Parent",
    email: "parent@example.com",
    role: "parent",
    familyId,
  });

  const child1 = await addDoc(collection(db, "users"), {
    name: "Alice",
    role: "child",
    familyId,
  });

  const child2 = await addDoc(collection(db, "users"), {
    name: "Bob",
    role: "child",
    familyId,
  });

  // --- Balances ---
  await addDoc(collection(db, "balances"), {
    userId: child1.id,
    tokenBalance: 10,
  });
  await addDoc(collection(db, "balances"), {
    userId: child2.id,
    tokenBalance: 5,
  });

  // --- Chores ---
  await addDoc(collection(db, "chores"), {
    title: "Clean room",
    reward: 2,
    familyId,
    status: "pending",
  });
  await addDoc(collection(db, "chores"), {
    title: "Do homework",
    reward: 3,
    familyId,
    status: "pending",
  });

  // --- Store Items ---
  await addDoc(collection(db, "storeItems"), {
    name: "Toy Car",
    price: 5,
    familyId,
  });
  await addDoc(collection(db, "storeItems"), {
    name: "Ice Cream",
    price: 2,
    familyId,
  });

  // --- Fines ---
  await addDoc(collection(db, "fines"), {
    reason: "Messy room",
    deduction: 1,
    familyId,
  });
  await addDoc(collection(db, "fines"), {
    reason: "Late homework",
    deduction: 2,
    familyId,
  });

  console.log("Demo data seeded ✅");
};
