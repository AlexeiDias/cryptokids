export interface Chore {
    id: string;
    title: string;
    description: string;
    rewardTokens: number;
    status: "pending" | "completed";
    assignedTo: string;
    familyId: string;
  }
  