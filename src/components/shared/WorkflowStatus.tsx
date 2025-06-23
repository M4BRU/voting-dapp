"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { readContract } from "@wagmi/core";
import { chainsToVoting, votingAbi } from "@/constants";
import { Address } from "viem";

const workflowLabels = [
  "Registering Voters",
  "Proposals Registration Started",
  "Proposals Registration Ended",
  "Voting Session Started",
  "Voting Session Ended",
  "Votes Tallied",
];

type WorkflowStatusProps = {
  refreshSignal?: number;
};

export default function WorkflowStatus({ refreshSignal }: WorkflowStatusProps) {
  const [hasMounted, setHasMounted] = useState(false);

  const chainId = useChainId();
  const config = useConfig();
  const votingAddress = chainsToVoting[chainId]?.voting;
  const { address } = useAccount();

  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !votingAddress || !address) return;

    async function fetchStatus() {
      setLoading(true);
      try {
        const workflowStatus = (await readContract(config, {
          address: votingAddress as Address,
          abi: votingAbi,
          functionName: "workflowStatus",
          account: address as Address,
        })) as number;

        setStatus(workflowStatus);
      } catch (err) {
        console.error("Erreur lors de la récupération du workflowStatus:", err);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [hasMounted, votingAddress, address, config, refreshSignal]);

  if (!hasMounted) return null;

  return (
    <div className="p-4 border rounded-md bg-blue-50 text-blue-900">
      <strong>Statut actuel du workflow :</strong>{" "}
      {loading ? (
        <span>Chargement...</span>
      ) : status !== null ? (
        <span>{workflowLabels[status]}</span>
      ) : (
        <span>Inconnu</span>
      )}
    </div>
  );
}
