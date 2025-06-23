"use client";

import Image from "next/image";
import Header from "@/components/Header";
import VotingForm from "@/components/shared/VotingForm";
import ConnectWallet from "@/components/shared/ConnectWallet";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();
  return (
    <div>
      {!isConnected ? (
        <ConnectWallet />
      ) : (
        <div>
          <VotingForm />
        </div>
      )}
    </div>
  );
}
