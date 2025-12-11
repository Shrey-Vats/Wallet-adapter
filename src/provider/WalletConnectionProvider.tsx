import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, type FC } from "react";


const WalletConnectionProvider: FC<{ children: React.ReactNode }> = ({children}) => {
    const network = "devnet";
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallet = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter()
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallet} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default WalletConnectionProvider