"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { votingAbi, chainsToVoting } from "@/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

export default function Winner() {
  const { address, chain } = useAccount();
  const votingAddress = chainsToVoting[chain?.id || 0]?.voting;

  const [winningProposalId, setWinningProposalId] = useState<number | null>(
    null
  );
  const [winnerDescription, setWinnerDescription] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const {
    data: winnerIdData,
    isError: isErrorId,
    error: errorId,
    refetch: refetchWinnerId,
  } = useReadContract({
    abi: votingAbi,
    address: votingAddress as `0x${string}`,
    functionName: "winningProposalID",
  });

  const {
    data: proposalData,
    isError: isErrorProposal,
    error: errorProposal,
    refetch: refetchProposal,
  } = useReadContract({
    abi: votingAbi,
    address: votingAddress as `0x${string}`,
    functionName: "getOneProposal",
    args: winningProposalId !== null ? [BigInt(winningProposalId)] : undefined,
    query: { enabled: winningProposalId !== null },
    account: address as `0x${string}`,
  });

  // Met à jour l'ID gagnant
  useEffect(() => {
    if (winnerIdData !== undefined) {
      const id = Number(winnerIdData);
      setWinningProposalId(id);
    }
  }, [winnerIdData]);

  // Met à jour la description du gagnant
  useEffect(() => {
    if (
      proposalData &&
      typeof proposalData === "object" &&
      "description" in proposalData
    ) {
      setWinnerDescription(proposalData.description as string);
    }
  }, [proposalData]);

  // Gestion d’erreurs
  useEffect(() => {
    if (isErrorId)
      setError(
        errorId?.message || "Erreur lors de la récupération de l’ID gagnant."
      );
    else if (isErrorProposal)
      setError(
        errorProposal?.message ||
          "Erreur lors de la récupération de la proposition gagnante."
      );
    else setError(null);
  }, [isErrorId, isErrorProposal]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🏆 Proposition Gagnante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : winningProposalId === null ? (
          <p>Chargement de l’ID gagnant...</p>
        ) : (
          <>
            <p>
              <strong>ID:</strong> {winningProposalId}
            </p>
            {winnerDescription !== null ? (
              <p>
                <strong>Description:</strong> {winnerDescription}
              </p>
            ) : (
              <p>Chargement de la proposition gagnante...</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
