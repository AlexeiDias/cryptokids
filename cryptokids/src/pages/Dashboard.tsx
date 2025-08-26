import React, { useEffect, useState } from "react";
import {
  addChild,
  deleteChild,
  listenToChildren,
  listenToChores,
  listenToFines,
  listenToFamilyTransactions,
  listenToStoreItems,
  updateChild,
  addChore,
  deleteChore,
  addStoreItem,
  deleteStoreItem,
  addFine,
  deleteFine,
  applyFineToChild
} from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const familyId = user?.familyId;

  type Child = {
    id: string;
    name: string;
    tokenMintAddress?: string;
    _justSaved?: boolean; // UI only
  };
  const [children, setChildren] = useState<Child[]>([]);
  
  const [newChild, setNewChild] = useState("");
  const [chores, setChores] = useState<any[]>([]);
  const [newChore, setNewChore] = useState<any>({
    title: "",
    description: "",
    rewardTokens: 0,
    assignedTo: ""
  });
  const [fines, setFines] = useState<any[]>([]);
  const [newFine, setNewFine] = useState({ reason: "", deductionTokens: 0 });
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: "", priceTokens: 0, description: "" });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState("all");

  useEffect(() => {
    if (!familyId) return;

    const unsubChildren = listenToChildren(familyId, setChildren);
    const unsubChores = listenToChores(familyId, setChores);
    const unsubFines = listenToFines(familyId, setFines);
    const unsubStore = listenToStoreItems(familyId, setStoreItems);
    const unsubTx = listenToFamilyTransactions(familyId, setTransactions);

    return () => {
      unsubChildren();
      unsubChores();
      unsubFines();
      unsubStore();
      unsubTx();
    };
  }, [familyId]);

  const handleAddChild = async () => {
    if (!newChild || !familyId) return;
    await addChild(familyId, newChild);
    setNewChild("");
  };

  const handleDeleteChild = async (id: string) => {
    if (confirm("Are you sure you want to delete this child?")) {
      await deleteChild(id);
    }
  };

  
  const handleUpdateTokenMint = (childId: string, value: string) => {
    const updated = children.map((child) =>
      child.id === childId ? { ...child, tokenMintAddress: value } : child
    );
    setChildren(updated);
  };

  const handleBlurTokenMint = async (childId: string, value: string) => {
    await updateChild(childId, { tokenMintAddress: value });
  
    // Show "Saved" message for 2 seconds
    setChildren((prev) =>
      prev.map((c) =>
        c.id === childId ? { ...c, _justSaved: true } : c
      )
    );
  
    setTimeout(() => {
      setChildren((prev) =>
        prev.map((c) =>
          c.id === childId ? { ...c, _justSaved: false } : c
        )
      );
    }, 2000);
  };
  
  

  const handleAddChore = async () => {
    if (!familyId || !newChore.title || !newChore.assignedTo) return;
    await addChore(familyId, newChore);
    setNewChore({ title: "", description: "", rewardTokens: 0, assignedTo: "" });
  };

  const handleDeleteChore = async (choreId: string) => {
    await deleteChore(choreId);
  };

  const handleAddItem = async () => {
    if (!familyId || !newItem.name) return;
    await addStoreItem(familyId, newItem);
    setNewItem({ name: "", priceTokens: 0, description: "" });
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteStoreItem(itemId);
  };

  const handleAddFine = async () => {
    if (!familyId || !newFine.reason) return;
    await addFine(familyId, newFine);
    setNewFine({ reason: "", deductionTokens: 0 });
  };

  const handleDeleteFine = async (fineId: string) => {
    await deleteFine(fineId);
  };

  const handleApplyFine = async (childId: string, amount: number) => {
    await applyFineToChild(familyId, childId, amount);
    alert(`Fine of ${amount} applied to ${childId}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Parent Dashboard</h2>

      {/* Children */}
      <section>
        <h3>Children</h3>
        <input
          value={newChild}
          onChange={(e) => setNewChild(e.target.value)}
          placeholder="Child name"
        />
        <button onClick={handleAddChild}>Add Child</button>

        <ul>
  {children.map((c) => (
    <li key={c.id} style={{ marginBottom: "10px" }}>
      <div><b>{c.name}</b></div>

      {/* Editable token mint field */}
      <label>
        Token Mint Address:{" "}
        <input
          type="text"
          value={c.tokenMintAddress || ""}
          onChange={(e) => handleUpdateTokenMint(c.id, e.target.value)}
          onBlur={(e) => handleBlurTokenMint(c.id, e.target.value)}
          style={{ width: "300px", marginRight: "10px" }}
        />
      </label>

      {/* Helper text */}
      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
        Auto-saves when you click outside the field
      </div>

      {/* Confirmation */}
      {c._justSaved && (
        <div style={{ fontSize: "12px", color: "green", marginTop: "2px" }}>
          ✅ Saved
        </div>
      )}

      <button onClick={() => handleDeleteChild(c.id)}>Delete</button>
    </li>
  ))}
</ul>

      </section>

      {/* Chores */}
      <section style={{ marginTop: "30px" }}>
        <h3>Chores</h3>
        <input
          placeholder="Title"
          value={newChore.title}
          onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
        />
        <input
          placeholder="Description"
          value={newChore.description}
          onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Reward Tokens"
          value={newChore.rewardTokens}
          onChange={(e) => setNewChore({ ...newChore, rewardTokens: Number(e.target.value) })}
        />
        <select
          value={newChore.assignedTo}
          onChange={(e) => setNewChore({ ...newChore, assignedTo: e.target.value })}
        >
          <option value="" disabled>Assign to child...</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={handleAddChore}>Add Chore</button>

        <ul>
          {chores.map(chore => {
            const assignedChild = children.find(c => c.id === chore.assignedTo);
            return (
              <li key={chore.id}>
                {chore.title} - {chore.rewardTokens} tokens{" "}
                {assignedChild && (
                  <span style={{ fontStyle: "italic", marginLeft: "10px" }}>
                    (for {assignedChild.name})
                  </span>
                )}
                <button onClick={() => handleDeleteChore(chore.id)} style={{ marginLeft: "10px" }}>Delete</button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Store Items */}
      <section style={{ marginTop: "30px" }}>
        <h3>Store Items</h3>
        <input
          placeholder="Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newItem.priceTokens}
          onChange={(e) => setNewItem({ ...newItem, priceTokens: Number(e.target.value) })}
        />
        <input
          placeholder="Description"
          value={newItem.description}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
        />
        <button onClick={handleAddItem}>Add Item</button>

        <ul>
          {storeItems.map((i) => (
            <li key={i.id}>
              {i.name} – Price: {i.priceTokens}
              <button onClick={() => handleDeleteItem(i.id)} style={{ marginLeft: "10px" }}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Fines */}
      <section style={{ marginTop: "30px" }}>
        <h3>Fines</h3>
        <input
          placeholder="Reason"
          value={newFine.reason}
          onChange={(e) => setNewFine({ ...newFine, reason: e.target.value })}
        />
        <input
          type="number"
          placeholder="Deduction"
          value={newFine.deductionTokens}
          onChange={(e) => setNewFine({ ...newFine, deductionTokens: Number(e.target.value) })}
        />
        <button onClick={handleAddFine}>Add Fine</button>

        <ul>
          {fines.map(f => (
            <li key={f.id}>
              {f.reason} – Deduct: {f.deductionTokens}
              <select
                defaultValue=""
                onChange={e => {
                  if (e.target.value) handleApplyFine(e.target.value, f.deductionTokens);
                }}
              >
                <option value="" disabled>Apply to...</option>
                {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={() => handleDeleteFine(f.id)} style={{ marginLeft: "10px" }}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Transactions */}
      <section style={{ marginTop: "30px" }}>
        <h3>Family Transactions</h3>

        <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
          <option value="all">All</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <ul>
          {transactions
            .filter(tx => selectedChild === "all" || tx.userId === selectedChild)
            .map(tx => {
              const child = children.find(c => c.id === tx.userId);
              const isPositive = tx.amount > 0;

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

              return (
                <li key={tx.id}>
                  [{tx.type}] {tx.description} →{" "}
                  <span style={{ color: isPositive ? "green" : "red", fontWeight: "bold" }}>
                    {isPositive ? `+${tx.amount}` : tx.amount} tokens
                  </span>
                  {child && (
                    <span style={{ marginLeft: "10px", fontStyle: "italic" }}>
                      (for {child.name})
                    </span>
                  )}
                  <span style={{ marginLeft: "10px", color: "#666" }}>{relative}</span>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
