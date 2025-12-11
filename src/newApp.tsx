import { ed25519 } from "@noble/curves/ed25519.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionConfirmationStatus,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { getTokenMetadata, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

interface Token {
  name: string;
  pubKey: PublicKey;
  balance: number;
  symbol: string;
  decimals?: number;
  logo?: string;
}

interface TransactionItem {
  signature: string;
  time: Date;
  status: TransactionConfirmationStatus | "unknown";
  err: any;
}

const App = () => {
  const [balance, setBalance] = useState<number>(0);
  const [airdropAmount, setAirdropAmount] = useState<string>("");
  const [reciverAddress, setReciverAddress] = useState<string>("");
  const [lamportsToTransfer, setLamportsToTransfer] = useState<string>("");
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const [isBalanceGet, setIsBalanceGet] = useState<boolean>(false);
  const [isFeatchingBalance, setIsFeatchingBalance] = useState<boolean>(false);
  const [isAirdroping, setIsAirdroping] = useState<boolean>(false);

  const wallet = useWallet();
  const { connection } = useConnection();

  const handleShowBalance = async () => {
    try {
      setIsBalanceGet(true);
      setIsFeatchingBalance(true);
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected!");
      }
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance);
    } catch (error) {
      console.error("Error while featching balance: ", error);
      alert("Error while featching balance");
      return;
    } finally {
      setIsFeatchingBalance(false);
    }
    console.log(isFeatchingBalance)
  };

  const handleAirdrop = async () => {
    try {
      setIsAirdroping(true);
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected!");
      }
      await connection.requestAirdrop(
        wallet.publicKey,
        Number(airdropAmount) * LAMPORTS_PER_SOL
      );
    } catch (error) {
      console.error("Error while airdroping: ", error);
      alert("Error while airdroping");
      return;
    } finally {
      setIsAirdroping(false);
    }
  };

  const handleSignMessage = async () => {
    try {
      if (!wallet.publicKey) throw new Error("Wallet not connected!");
      if (!wallet.signMessage) throw new Error("sign message not supported");

      let message = "Verify your account by sigining message";
      let EncodedMessge = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(EncodedMessge);

      if (!ed25519.verify(signature, EncodedMessge, wallet.publicKey.toBytes()))
        throw new Error("Message signature invalid!");
      alert("Sign Message successfuly");
    } catch (error) {
      console.error("Error while signing message: ", error);
      alert("Error while signing message");
      return;
    }
  };

  const handleSendTokens = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Wallet not connected!");
      }

      if (Number(lamportsToTransfer) >= Number(balance)) {
        throw new Error("Insifficent balance to transfer");
      }

      const to = new PublicKey(reciverAddress);

      const transation = new Transaction();

      console.log(Number(lamportsToTransfer) * LAMPORTS_PER_SOL);

      transation.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          lamports: Number(lamportsToTransfer) * LAMPORTS_PER_SOL,
          toPubkey: to,
        })
      );

      console.log("before send transaction");
      const sig = await wallet.sendTransaction(transation, connection);

      console.log("signature: ", sig);
      alert("Transation sended!!");
    } catch (error) {
      console.error("Error while sending transation: ", error);
    }
  };

  const fetchTokens = async () => {
    if (!wallet.publicKey) return;
    try {
      const accounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );

      const tokenPromises = accounts.value.map(async (tokenAccount) => {
        try {
          const metadata = await getTokenMetadata(
            connection,
            tokenAccount.pubkey
          );
          return {
            name: metadata?.name || "Unknown Token",
            symbol: metadata?.symbol || "UNK",
            balance: tokenAccount.account.lamports, 
            pubKey: tokenAccount.pubkey,
          };
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(tokenPromises);
      setUserTokens(results.filter((t): t is Token => t !== null));
    } catch (error) {
      console.error("Token fetch failed", error);
    }
  };

  const handleFetchHistory = async () => {
    if (!wallet.connected || !wallet.publicKey) return;
    try {
      const signatures = await connection.getSignaturesForAddress(
        wallet.publicKey,
        { limit: 20 }
      );

      // Map first to avoid re-rendering loop
      const formatted = signatures.map((tx) => ({
        signature: tx.signature,
        time: new Date((tx.blockTime || 0) * 1000),
        status: tx.confirmationStatus! ,
        err: tx.err,
      }));

      setTransactions(formatted);
    } catch (error) {
      console.error("History fetch failed", error);
    }
  };
  useEffect(() => {
    if (!isBalanceGet) {
      handleShowBalance();
    }
  }, []);

  return (
    <div className="h-screen w-screen">
      {/*Connect to wallet*/}
      <div className="w-screen h-20">
        <WalletMultiButton />
      </div>
      <div className="h-full w-screen">
        {/*balance*/}
        <h1 className="justify-self-center font-bold text-2xl">{balance}</h1>
        <button onClick={handleShowBalance}>re featch</button>
        {/*airdrop*/}
        <div className="w-screen flex">
          <input
            type="number"
            placeholder="Enter the amount"
            value={airdropAmount}
            onChange={(e) => setAirdropAmount(e.target.value)}
          />
          <button
            disabled={isAirdroping}
            className={`px-2 py-4 rounded-xl border ${
              isAirdroping ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={handleAirdrop}
          >
            request airdrop
          </button>
        </div>
        {/*sign message*/}
        <button onClick={handleSignMessage}>Sign Message</button>
        {/*send tokens / sol*/}
        <div>
          <input
            type="text"
            placeholder="reciver address"
            value={reciverAddress}
            onChange={(e) => setReciverAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="enter amount"
            value={lamportsToTransfer}
            onChange={(e) => setLamportsToTransfer(e.target.value)}
          />
          <button onClick={handleSendTokens}>send transation</button>
        </div>

        <button onClick={handleFetchHistory}>transation history</button>
        {
          transactions.map((tx, i) => (
            <div className="w-screen flex rounded-xl border" key={i}>
              <p>{i}</p>
              <p>{tx.signature}</p>
              <p>{tx.status}</p>
              <p>{tx.time.toString()}</p>
            </div>
          ))
        }

        <div>
          <button onClick={fetchTokens}>all tokens</button>
          {userTokens.length !== 0 ? (
            <div>
              {userTokens.map((token, i) => (
                <div className="w-screen h-20 rounded-2xl flex gap-2">
                  <p>{i}</p>
                  <h1 className="font-semibold text-2xl">{token.name}</h1>
                  <h1>{token.balance.toString()}</h1>
                  <h1>{token.pubKey.toString()}</h1>
                  <h1>{token.symbol}</h1>
                </div>
              ))}
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
