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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { chainsToVoting, votingAbi } from "@/constants";
export type ProposalType = {
  id: number;
  description: string;
  voteCount: number;
};

type ProposalProps = {
  proposals: ProposalType[];
  loading: boolean;
  refetch: () => Promise<void>;
  getEvents: () => Promise<void>;
};

export default function Proposal({
  proposals,
  loading,
  refetch,
  getEvents,
}: ProposalProps) {
  const { address, chain } = useAccount();
  const [proposal, setProposal] = useState("");
  const votingAddress = chainsToVoting[chain?.id || 0]?.voting;
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

  async function submitProposal() {
    if (!proposal) {
      toast.warning("Veuillez entrer une proposition.");
      return;
    }

    try {
      await writeContractAsync({
        abi: votingAbi,
        address: votingAddress as `0x${string}`,
        functionName: "addProposal",
        args: [proposal],
      });
      toast.success("Proposition soumise avec succès !");
      setProposal("");
      refetch();
      getEvents();
    } catch (e) {
      toast.error("Erreur lors de la soumission de la proposition.");
      console.error(e);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Soumettre une proposition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="proposal">Proposition</Label>
          <Input
            id="proposal"
            placeholder="Décrivez votre proposition"
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />
        </div>

        <Button onClick={submitProposal} disabled={isPending || isConfirming}>
          {isPending || isConfirming ? "Soumission..." : "Soumettre"}
        </Button>

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
