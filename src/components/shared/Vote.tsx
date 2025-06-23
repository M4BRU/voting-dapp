"use client";

import { useState } from "react";
import {
  type BaseError,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { chainsToVoting, votingAbi } from "@/constants";

type VoteProps = {
  proposals: { id: number; description: string }[];
  refetch: () => Promise<void>;
  getEvents: () => Promise<void>;
};

export default function Vote({ proposals, refetch, getEvents }: VoteProps) {
  const { chain, address } = useAccount();
  const votingAddress = chainsToVoting[chain?.id || 0]?.voting;

  const [selectedProposalId, setSelectedProposalId] = useState<number | "">("");
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  const {
    data: hash,
    error,
    isPending,
    writeContractAsync,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: errorConfirmation,
  } = useWaitForTransactionReceipt({ hash });

  async function submitVote() {
    if (selectedProposalId === "") {
      toast.warning("Veuillez sélectionner une proposition.");
      return;
    }
    if (!address) {
      toast.error("Veuillez connecter votre wallet pour voter.");
      return;
    }

    try {
      setIsSubmittingVote(true);
      await writeContractAsync({
        abi: votingAbi,
        address: votingAddress as `0x${string}`,
        functionName: "setVote",
        args: [selectedProposalId],
      });
      toast.success("Vote enregistré avec succès !");
      setSelectedProposalId("");
      refetch();
      getEvents();
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement du vote.");
      console.error(e);
    } finally {
      setIsSubmittingVote(false);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Vote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="proposalSelect">Choisissez une proposition</Label>
          <select
            id="proposalSelect"
            className="rounded border border-gray-300 px-3 py-2"
            value={selectedProposalId}
            onChange={(e) => setSelectedProposalId(Number(e.target.value))}
            disabled={isSubmittingVote || isPending || isConfirming}
          >
            <option value="">-- Sélectionnez une proposition --</option>
            {proposals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.description}
              </option>
            ))}
          </select>
          <Button
            onClick={submitVote}
            disabled={
              isSubmittingVote ||
              isPending ||
              isConfirming ||
              selectedProposalId === ""
            }
          >
            {isSubmittingVote || isPending || isConfirming
              ? "Vote en cours..."
              : "Voter"}
          </Button>
        </div>

        {(error || errorConfirmation) && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {(error as BaseError)?.shortMessage ||
                error?.message ||
                errorConfirmation?.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
