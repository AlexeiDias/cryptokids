// src/services/firestoreService.ts

import { auth, db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  getDoc,
  increment,
  runTransaction,
  orderBy
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { serverTimestamp } from "firebase/firestore";

import { Chore } from "../utils/types";

const connection = new Connection("https://api.mainnet-beta.solana.com");

export const getTokenBalance = async (walletAddress: string, tokenMint: string) => {
  const publicKey = new PublicKey(walletAddress);
  const mint = new PublicKey(tokenMint);
  const ata = await getAssociatedTokenAddress(mint, publicKey);
  const accountInfo = await connection.getTokenAccountBalance(ata);
  return Number(accountInfo.value.amount) / Math.pow(10, accountInfo.value.decimals);
};

//
// 🧒 Create Child Account
//
export const createChildAccount = async (
  familyId: string,
  email: string,
  password: string
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    role: "child",
    familyId,
    walletAddress: null,
    tokenMintAddress: null, // <-- add this
    createdAt: new Date(),
  });

  await setDoc(doc(db, "balances", cred.user.uid), {
    tokenBalance: 0,
  });

  return cred.user.uid;
};

export const updateChild = (childId: string, updates: any) =>
  updateDoc(doc(db, "users", childId), updates);

//
// ✏️ Update Child's Token Mint Address
//
export const updateChildTokenMintAddress = async (
  childId: string,
  tokenMintAddress: string
) => {
  const ref = doc(db, "users", childId);
  await updateDoc(ref, { tokenMintAddress });
};


//
// ✅ Chores
//
export const addChore = (familyId: string, chore: any) =>
  addDoc(collection(db, "chores"), { ...chore, familyId, status: "pending" });

export const updateChore = (id: string, updates: any) =>
  updateDoc(doc(db, "chores", id), updates);

export const deleteChore = (id: string) =>
  deleteDoc(doc(db, "chores", id));

export const listenToChores = (
  familyId: string,
  callback: (data: any[]) => void
) => {
  const q = query(collection(db, "chores"), where("familyId", "==", familyId));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const listenToChildChores = (
  familyId: string,
  childId: string,
  callback: (data: Chore[]) => void
) => {
  const q = query(
    collection(db, "chores"),
    where("familyId", "==", familyId),
    where("assignedTo", "==", childId)
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Chore, "id">) })))
  );
};

export const completeChore = async (choreId: string) => {
  const ref = doc(db, "chores", choreId);
  await updateDoc(ref, { status: "completed" });

  const snap = await getDocs(
    query(collection(db, "chores"), where("__name__", "==", choreId))
  );

  if (!snap.empty) {
    const chore = snap.docs[0].data();
    const assignedTo = chore["assignedTo"];
    const reward = chore["rewardTokens"] ?? 0;
    const familyId = chore["familyId"];

    const balRef = doc(db, "balances", assignedTo);
    await updateDoc(balRef, { tokenBalance: increment(reward) });

    await addDoc(collection(db, "transactions"), {
      userId: assignedTo,
      familyId,
      type: "chore",
      amount: reward,
      description: `Completed chore: ${chore["title"]}`,
      createdAt: new Date(),
    });
  }
};

//
// 🛍 Store Items
//
export const addStoreItem = (familyId: string, item: any) =>
  addDoc(collection(db, "storeItems"), { ...item, familyId });

export const deleteStoreItem = (id: string) =>
  deleteDoc(doc(db, "storeItems", id));

export const listenToStoreItems = (
  familyId: string,
  callback: (data: any[]) => void
) => {
  const q = query(collection(db, "storeItems"), where("familyId", "==", familyId));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

//
// ❗ Fines
//
export const addFine = (familyId: string, fine: any) =>
  addDoc(collection(db, "fines"), { ...fine, familyId });

export const deleteFine = (id: string) =>
  deleteDoc(doc(db, "fines", id));

export const listenToFines = (
  familyId: string,
  callback: (data: any[]) => void
) => {
  const q = query(collection(db, "fines"), where("familyId", "==", familyId));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const applyFineToChild = async (childId: string, deduction: number) => {
  const userRef = doc(db, "balances", childId);
  await updateDoc(userRef, { tokenBalance: increment(-deduction) });
  await addDoc(collection(db, "transactions"), {
    userId: childId,
    type: "fine",
    amount: -deduction,
    description: "Fine applied",
    createdAt: new Date(),
  });
};

//
// 💰 Balances
//
export const listenToBalance = (
  userId: string,
  callback: (bal: number) => void
) => {
  const ref = doc(db, "balances", userId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data()?.tokenBalance ?? 0);
  });
};

//
// 👶 Children
//
export const listenToChildren = (
  familyId: string,
  callback: (data: any[]) => void
) => {
  const q = query(
    collection(db, "users"),
    where("familyId", "==", familyId),
    where("role", "==", "child")
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const addChild = async (familyId: string, name: string) => {
  const ref = await addDoc(collection(db, "users"), {
    familyId,
    role: "child",
    name,
    email: `${name.toLowerCase()}@demo.local`,
    tokenMintAddress: null, // <-- add this
    createdAt: new Date(),
  });

  await setDoc(doc(db, "balances", ref.id), { tokenBalance: 0 });
  return ref.id;
};

export const deleteChild = async (childId: string) => {
  await deleteDoc(doc(db, "users", childId));
  await deleteDoc(doc(db, "balances", childId));
};

//
// 🔁 Transactions
//
export const listenToTransactions = (
  familyId: string,
  userId: string,
  callback: (data: any[]) => void
) => {
  const q = query(
    collection(db, "transactions"),
    where("familyId", "==", familyId),
    where("userId", "==", userId)
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const listenToFamilyTransactions = (
  familyId: string,
  callback: (data: any[]) => void
) => {
  const q = query(collection(db, "transactions"), where("familyId", "==", familyId));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

//
// 🎁 Redeem Store Item
//
export const redeemStoreItem = async (
  userId: string,
  itemId: string,
  price: number
): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const balRef = doc(db, "balances", userId);
      const balSnap = await transaction.get(balRef);

      if (!balSnap.exists()) throw "Balance not found";
      const currentBalance = balSnap.data().tokenBalance;

      if (currentBalance < price) throw "Insufficient balance";

      transaction.update(balRef, { tokenBalance: currentBalance - price });
      transaction.set(doc(collection(db, "transactions")), {
        userId,
        type: "redeem",
        amount: -price,
        description: "Redeemed store item",
        createdAt: new Date(),
      });
    });
    return true;
  } catch (err) {
    console.error("Redeem failed", err);
    return false;
  }
};

//
// 👤 Get User Data
//
export const getUserData = async (uid: string) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const addNotification = async (familyId: string, message: string) => {
  const notificationsRef = collection(db, "families", familyId, "notifications");
  await addDoc(notificationsRef, {
    message,
    createdAt: serverTimestamp(),
  });
};

export const listenToNotifications = (
  familyId: string,
  callback: (data: any[]) => void
) => {
  const notificationsRef = collection(db, "families", familyId, "notifications");
  const q = query(notificationsRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};