import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listenToChores, updateChore,
  listenToBalance,
  listenToStoreItems, redeemStoreItem,
  listenToTransactions
} from "../services/firestoreService";
import {
  connectPhantom,
  getPhantomBalance,
  getSPLTokenBalance
} from "../services/phantomService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const ChildDashboard: React.FC = () => {
  const { user } = useAuth();
  const familyId = user?.familyId;
  const userId = user?.uid;

  const [chores, setChores] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [phantomPubkey, setPhantomPubkey] = useState<string | null>(null);
  const [phantomBalance, setPhantomBalance] = useState<number | null>(null);
  const [splTokenBalance, setSplTokenBalance] = useState<number | null>(null);
  const [tokenMintAddress, setTokenMintAddress] = useState<string | null>(null);

  // Subscriptions
  useEffect(() => {
    if (familyId && userId) {
      const unsubChores = listenToChores(familyId, (data) =>
        setChores(data.filter((c) => c.assignedTo === userId && c.status === "pending"))
      );
      const unsubBal = listenToBalance(userId, setBalance);
      const unsubItems = listenToStoreItems(familyId, setStoreItems);
      const unsubTx = listenToTransactions(familyId, userId, setTransactions);

      // Fetch user's tokenMintAddress
      const fetchUser = async () => {
        const ref = doc(db, "users", userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setTokenMintAddress(data.tokenMintAddress || null);
        }
      };

      fetchUser();

      return () => {
        unsubChores();
        unsubBal();
        unsubItems();
        unsubTx();
      };
    }
  }, [familyId, userId]);

  const handleCompleteChore = async (choreId: string) => {
    await updateChore(choreId, { status: "completed" });
  };

  const handleRedeem = async (itemId: string, price: number) => {
    if (!userId) return;
    const success = await redeemStoreItem(userId, itemId, price);
    if (!success) alert("Not enough tokens to redeem this item.");
  };

  const handleConnectPhantom = async () => {
    try {
      const pubkey = await connectPhantom();
      if (pubkey) {
        setPhantomPubkey(pubkey);
        const sol = await getPhantomBalance(pubkey);
        setPhantomBalance(sol);

        if (tokenMintAddress) {
          const tokens = await getSPLTokenBalance(pubkey, tokenMintAddress);
          setSplTokenBalance(tokens);
        } else {
          alert("Token Mint Address not set. Ask your parent to assign one.");
        }
      }
    } catch (err) {
      console.error("Phantom connection failed", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Child Dashboard</h2>
      <p><b>Your In-App Balance:</b> {balance} tokens</p>

      {/* --- Phantom Wallet --- */}
      <section style={{ marginTop: "30px" }}>
        <h3>Phantom Wallet</h3>
        {phantomPubkey ? (
          <div>
            <p><b>Connected:</b> {phantomPubkey}</p>
            <p><b>SOL Balance:</b> {phantomBalance} SOL</p>
            <p><b>Token Balance:</b> {splTokenBalance ?? "N/A"} {tokenMintAddress ? "" : "(No token assigned)"}</p>
          </div>
        ) : (
          <button onClick={handleConnectPhantom}>Connect Phantom Wallet</button>
        )}
      </section>

      {/* --- Chores --- */}
      <section style={{ marginTop: "30px" }}>
        <h3>Your Chores</h3>
        <ul>
          {chores.map((c) => (
            <li key={c.id}>
              {c.title} – Reward: {c.rewardTokens}
              <button onClick={() => handleCompleteChore(c.id)}>Mark Complete</button>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Store --- */}
      <section style={{ marginTop: "30px" }}>
        <h3>Store</h3>
        <ul>
          {storeItems.map((i) => (
            <li key={i.id}>
              {i.name} – Price: {i.priceTokens}
              <button onClick={() => handleRedeem(i.id, i.priceTokens)}>Redeem</button>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Transactions --- */}
      <section style={{ marginTop: "30px" }}>
        <h3>Your Transactions</h3>
        <ul>
          {transactions.map((tx) => (
            <li key={tx.id}>
              [{tx.type}] {tx.description} → {tx.amount}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ChildDashboard;
