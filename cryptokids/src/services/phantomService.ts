import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

const SOLANA_NETWORK = "https://api.mainnet-beta.solana.com"; // or devnet

export const connectPhantom = async (): Promise<string | null> => {
  const provider = (window as any).solana;

  if (!provider || !provider.isPhantom) {
    alert("Phantom wallet not found. Please install it.");
    return null;
  }

  try {
    const resp = await provider.connect();
    return resp.publicKey.toString();
  } catch (error) {
    console.error("Wallet connection failed:", error);
    return null;
  }
};

export const getPhantomBalance = async (pubkey: string): Promise<number> => {
  const connection = new Connection(SOLANA_NETWORK);
  const publicKey = new PublicKey(pubkey);
  const balanceLamports = await connection.getBalance(publicKey);
  return balanceLamports / 1e9; // Convert to SOL
};

// Use mainnet or devnet as appropriate
const connection = new Connection("https://api.mainnet-beta.solana.com");

export const getSPLTokenBalance = async (
  walletAddress: string,
  tokenMint: string
): Promise<number> => {
  try {
    const publicKey = new PublicKey(walletAddress);
    const mint = new PublicKey(tokenMint);

    const ata = await getAssociatedTokenAddress(mint, publicKey);
    const tokenAccount = await getAccount(connection, ata);

    return Number(tokenAccount.amount) / Math.pow(10, tokenAccount.decimals);
  } catch (err) {
    console.error("Error fetching SPL token balance:", err);
    return 0;
  }
  

};


