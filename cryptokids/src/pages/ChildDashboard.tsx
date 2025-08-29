import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listenToChores,
  updateChore,
  listenToBalance,
  listenToStoreItems,
  redeemStoreItem,
  listenToTransactions,
  listenToChildren,
  addNotification
} from "../services/firestoreService";
import { connectPhantom, getSPLTokenBalance } from "../services/phantomService";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";

const DEV_MODE = import.meta.env.DEV;

const ChildDashboard: React.FC = () => {
  const { user, setDevUserId } = useAuth();
  const familyId = user?.familyId;
  const userId = user?.uid;

  const [children, setChildren] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [phantomBalance, setPhantomBalance] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
const [completedChoreIds, setCompletedChoreIds] = useState<string[]>([]);
  useEffect(() => {
    if (familyId) {
      return listenToChildren(familyId, setChildren);
    }
  }, [familyId]);

  useEffect(() => {
    if (familyId && userId) {
      const unsubChores = listenToChores(familyId, (data) =>
        setChores(data.filter((c) => c.assignedTo === userId && c.status === "pending"))
      );
      const unsubBal = listenToBalance(userId, setBalance);
      const unsubItems = listenToStoreItems(familyId, setStoreItems);
      const unsubTx = listenToTransactions(familyId, userId, setTransactions);

      return () => {
        unsubChores();
        unsubBal();
        unsubItems();
        unsubTx();
      };
    }
  }, [familyId, userId]);

  const handleCompleteChore = async (chore: any) => {
    await updateChore(chore.id, { status: "completed" });
  
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
    if (currentChild?.name && familyId) {
      await addNotification(
        familyId,
        `${currentChild.name} completed "${chore.title}" at ${timeString}`
      );
    }
  };
  

  const handleRedeem = async (itemId: string, price: number) => {
    if (!userId) return;
    const success = await redeemStoreItem(userId, itemId, price);
    if (!success) alert("Not enough tokens to redeem this item.");
  };

  const handleConnectPhantom = async () => {
    try {
      const pubkey = await connectPhantom();
      const child = children.find((c) => c.id === user?.uid);
      const tokenMint = child?.tokenMintAddress;

      if (!tokenMint) {
        alert("No token mint address set for this child.");
        return;
      }

      const bal = await getSPLTokenBalance(pubkey, tokenMint);
      setPhantomBalance(bal);
    } catch (err) {
      console.error("Phantom connection failed", err);
    }
  };

  const visibleChores = chores.filter((chore) => {
    const choreDay = dayjs(selectedDate).format("dddd");
  
    if (chore.frequency === "daily") return true;
    if (chore.frequency === "weekly") return chore.daysOfWeek?.includes(choreDay);
    if (chore.frequency === "once") {
      const created = chore.createdAt?.toDate?.();
      return created && dayjs(created).isSame(selectedDate, "day");
    }
  
    return false;
  });

  const handleToggleChore = async (choreId: string, isCompleted: boolean) => {
    if (isCompleted) {
      setCompletedChoreIds(prev => prev.filter(id => id !== choreId));
      // Optionally update Firestore to undo completion
    } else {
      setCompletedChoreIds(prev => [...prev, choreId]);
      
      // 👇 Existing logic — keep notification to parent
      await addNotification(familyId, {
        message: `${user?.name} completed a chore: ${choreId}`,
        type: "chore_completed",
        timestamp: new Date().toISOString(),
      });
    }
  };
  
  

  const currentChild = children.find((c) => c.id === user?.uid);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Child Dashboard</h2>

      {/* ✅ Logged-in child info */}
      <p style={{ fontStyle: "italic", color: "#555" }}>
        Logged in as: {currentChild?.name || user?.email || user?.uid}
      </p>

      {/* 🔁 DEV MODE: switch child UID */}
      {DEV_MODE && setDevUserId && (
        <div style={{ marginBottom: "20px" }}>
          <label>
            <b>Switch Child:</b>
            <select
              style={{ marginLeft: "10px" }}
              value={user?.uid}
              onChange={(e) => setDevUserId(e.target.value)}
            >
              <option value="">Select child...</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || "Unnamed"} ({c.id.slice(0, 6)}…)
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <p>
        <b>Your Balance:</b> {balance} tokens
      </p>

      {/* Phantom Wallet */}
      <button onClick={handleConnectPhantom}>Connect Phantom Wallet</button>
      {phantomBalance !== null && (
        <p>
          <b>Phantom Balance:</b> {phantomBalance} SPL tokens
        </p>
      )}

<div style={{ marginTop: "2rem" }}>
  <h3>My Chores</h3>
  <Calendar onChange={setSelectedDate} value={selectedDate} />
  
  <div style={{ marginTop: "1rem" }}>
    <h4>Chores for {dayjs(selectedDate).format("dddd, MMM D")}</h4>
    <ul>
      {visibleChores.map((chore) => {
        const isCompleted = completedChoreIds.includes(chore.id);

        return (
          <li key={chore.id}>
            <label>
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={() => handleToggleChore(chore.id, isCompleted)}
              />
              {chore.title}
            </label>
          </li>
        );
      })}
    </ul>
  </div>
</div>


      {/* Chores */}
      <section>
        <h3>Your Chores</h3>
        <ul>
          {chores.map((c) => (
            <li key={c.id}>
            {c.title} – Reward: {c.rewardTokens}
            <button onClick={() => handleCompleteChore(c)}>Mark Complete</button>
          </li>
          ))}
        </ul>
      </section>

      {/* Store Items */}
      <section style={{ marginTop: "30px" }}>
        <h3>Store</h3>
        <ul>
          {storeItems.map((i) => (
            <li key={i.id}>
              {i.name} – Price: {i.priceTokens}{" "}
              <button onClick={() => handleRedeem(i.id, i.priceTokens)}>Redeem</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Transactions */}
      <section style={{ marginTop: "30px" }}>
        <h3>Your Transactions</h3>
        <ul>
          {transactions.map((tx) => {
            const date = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
            const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
            const diffMs = date.getTime() - Date.now();
            const diffMins = Math.round(diffMs / 60000);
            let relative = "";
            if (Math.abs(diffMins) < 60) {
              relative = rtf.format(diffMins, "minute");
            } else if (Math.abs(diffMins) < 1440) {
              relative = rtf.format(Math.round(diffMins / 60), "hour");
            } else {
              relative = rtf.format(Math.round(diffMins / 1440), "day");
            }
            const isPositive = tx.amount > 0;
            return (
              <li key={tx.id}>
                [{tx.type}] {tx.description} →{" "}
                <span style={{ color: isPositive ? "green" : "red", fontWeight: "bold" }}>
                  {isPositive ? `+${tx.amount}` : tx.amount} tokens
                </span>{" "}
                <span style={{ color: "#666" }}>{relative}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default ChildDashboard;
