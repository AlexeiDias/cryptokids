import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addChore, deleteChore, listenToChores,
  addStoreItem, deleteStoreItem, listenToStoreItems,
  addFine, deleteFine, listenToFines, applyFineToChild,
  listenToChildren, listenToFamilyTransactions, addChild, deleteChild
} from "../services/firestoreService";
import { resetFirestore } from "../utils/resetFirestore";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [chores, setChores] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("all");

  const [newChore, setNewChore] = useState({ title:"", description:"", rewardTokens:0, assignedTo:"" });
  const [newItem, setNewItem] = useState({ name:"", priceTokens:0, description:"" });
  const [newFine, setNewFine] = useState({ reason:"", deductionTokens:0 });
  const [newChild, setNewChild] = useState("");

  // Subscriptions
  useEffect(() => {
    if (user?.familyId) {
      const unsubChores = listenToChores(user.familyId, setChores);
      const unsubItems = listenToStoreItems(user.familyId, setStoreItems);
      const unsubFines = listenToFines(user.familyId, setFines);
      const unsubChildren = listenToChildren(user.familyId, setChildren);
      const unsubTx = listenToFamilyTransactions(user.familyId, setTransactions);
      return () => { unsubChores(); unsubItems(); unsubFines(); unsubChildren(); unsubTx(); };
    }
  }, [user?.familyId]);

  // Children
  const handleAddChild = async () => {
    if (!user?.familyId || !newChild) return;
    await addChild(user.familyId, newChild);
    setNewChild("");
  };

  // Chores
  const handleAddChore = async () => {
    if(user?.familyId){
      await addChore(user.familyId, newChore as any);
      setNewChore({title:"",description:"",rewardTokens:0,assignedTo:""});
    }
  };

  // Store
  const handleAddItem = async () => {
    if(user?.familyId){
      await addStoreItem(user.familyId, newItem);
      setNewItem({name:"",priceTokens:0,description:""});
    }
  };

  // Fines
  const handleAddFine = async () => {
    if(user?.familyId){
      await addFine(user.familyId, newFine);
      setNewFine({reason:"",deductionTokens:0});
    }
  };

  const handleApplyFine = async (childId:string, deduction:number) => {
    await applyFineToChild(childId, deduction);
    alert(`Fine of ${deduction} applied to ${childId}`);
  };

  return (
    <div style={{padding:"20px"}}>
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
            <li key={c.id}>
              {c.name}
              <button onClick={() => deleteChild(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Chores */}
<section>
  <h3>Chores</h3>
  <input
    placeholder="Title"
    value={newChore.title}
    onChange={e => setNewChore({ ...newChore, title: e.target.value })}
  />
  <input
    placeholder="Description"
    value={newChore.description}
    onChange={e => setNewChore({ ...newChore, description: e.target.value })}
  />
  <input
    type="number"
    placeholder="Reward Tokens"
    value={newChore.rewardTokens}
    onChange={e => setNewChore({ ...newChore, rewardTokens: Number(e.target.value) })}
  />
  <select
  value={newChore.assignedTo}
  onChange={e => setNewChore({ ...newChore, assignedTo: e.target.value })}
>
  <option value="" disabled>Assign to child...</option>
  {children.map(c => (
    <option key={c.id} value={c.id}>{c.name}</option>
  ))}
</select>

  <button onClick={handleAddChore}>Add Chore</button>

  <ul>
  {chores.map(chore => {
    const assignedChild = children.find(c => c.id === chore.assignedTo);
    return (
      <li key={chore.id}>
        {chore.title} - {chore.rewardTokens} tokens
        {assignedChild && (
          <span style={{ marginLeft: "10px", fontStyle: "italic" }}>
            (for {assignedChild.name})
          </span>
        )}
        <button onClick={() => handleDeleteChore(chore.id)}>Delete</button>
      </li>
    );
  })}
</ul>

</section>


      {/* Store Items */}
      <section style={{marginTop:"30px"}}>
        <h3>Store Items</h3>
        <input placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
        <input type="number" placeholder="Price" value={newItem.priceTokens} onChange={e=>setNewItem({...newItem,priceTokens:Number(e.target.value)})}/>
        <input placeholder="Description" value={newItem.description} onChange={e=>setNewItem({...newItem,description:e.target.value})}/>
        <button onClick={handleAddItem}>Add Item</button>
        <ul>{storeItems.map(i=><li key={i.id}>{i.name} - {i.priceTokens} <button onClick={()=>deleteStoreItem(i.id)}>Delete</button></li>)}</ul>
      </section>

      {/* Fines */}
      <section style={{marginTop:"30px"}}>
        <h3>Fines</h3>
        <input placeholder="Reason" value={newFine.reason} onChange={e=>setNewFine({...newFine,reason:e.target.value})}/>
        <input type="number" placeholder="Deduction" value={newFine.deductionTokens} onChange={e=>setNewFine({...newFine,deductionTokens:Number(e.target.value)})}/>
        <button onClick={handleAddFine}>Add Fine</button>
        <ul>
          {fines.map(f=>
            <li key={f.id}>{f.reason} - {f.deductionTokens}
              <button onClick={()=>deleteFine(f.id)}>Delete</button>
              <select defaultValue="" onChange={e=>{ if(e.target.value) handleApplyFine(e.target.value, f.deductionTokens); }}>
                <option value="" disabled>Apply to...</option>
                {children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </li>
          )}
        </ul>
      </section>

      {/* Transactions */}
      <section style={{marginTop:"30px"}}>
        <h3>Transactions</h3>
        <select value={selectedChild} onChange={e=>setSelectedChild(e.target.value)}>
          <option value="all">All</option>
          {children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <ul>
  {transactions
    .filter(tx => selectedChild === "all" || tx.userId === selectedChild)
    .map(tx => {
      const child = children.find(c => c.id === tx.userId);
      const isPositive = tx.amount > 0;

      // get Date object from Firestore timestamp or JS Date
      const date = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);

      // relative time formatter
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
          <span style={{ marginLeft: "10px", color: "#666" }}>
            {relative}
          </span>
        </li>
      );
    })}
</ul>





      </section>

      <button onClick={resetFirestore}>Reset Firestore</button>
    </div>
  );
};

export default Dashboard;
