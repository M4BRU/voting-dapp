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

type AdminProps = {
  refetch: () => Promise<void>;
  getEvents: () => Promise<void>;
  workflowStatus: number | null;
};

export default function Admin({
  refetch,
  getEvents,
  workflowStatus,
}: AdminProps) {
  const { chain } = useAccount();
  const votingAddress = chainsToVoting[chain?.id || 0]?.voting;

  const [voterAddress, setVoterAddress] = useState("");
  const [isSubmittingAddVoter, setIsSubmittingAddVoter] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<
    | "startProposalsRegistering"
    | "endProposalsRegistering"
    | "startVotingSession"
    | "endVotingSession"
    | "tallyVotes"
    | ""
  >("");

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

  const registrationClosed = workflowStatus !== null && workflowStatus > 0;

  async function submitAddVoter() {
    if (!voterAddress || !voterAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.warning("Veuillez entrer une adresse Ethereum valide.");
      return;
    }

    try {
      setIsSubmittingAddVoter(true);
      await writeContractAsync({
        abi: votingAbi,
        address: votingAddress as `0x${string}`,
        functionName: "addVoter",
        args: [voterAddress],
      });
      toast.success("Votant ajouté avec succès !");
      setVoterAddress("");
      refetch();
      getEvents();
    } catch (e) {
      toast.error("Erreur lors de l'ajout du votant.");
      console.error(e);
    } finally {
      setIsSubmittingAddVoter(false);
    }
  }

  async function submitWorkflowChange() {
    if (!workflowAction) {
      toast.warning("Veuillez sélectionner une action de workflow.");
      return;
    }

    try {
      if (
        !votingAddress ||
        votingAddress === "0x0000000000000000000000000000000000000000"
      ) {
        toast.error("Adresse du contrat invalide. Vérifiez votre réseau.");
        return;
      }
      await writeContractAsync({
        abi: votingAbi,
        address: votingAddress as `0x${string}`,
        functionName: workflowAction,
      });
      toast.success("Changement de workflow effectué avec succès !");
      setWorkflowAction("");
      refetch();
      getEvents();
    } catch (e) {
      toast.error("Erreur lors du changement de workflow.");
      console.error(e);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Administration du Voting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Ajouter Votant */}
        {workflowStatus === 0 && (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="voterAddress">Ajouter un votant (Whitelist)</Label>
            <Input
              id="voterAddress"
              placeholder="Adresse Ethereum du votant"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              disabled={isSubmittingAddVoter || isPending || isConfirming}
            />
            <Button
              onClick={submitAddVoter}
              disabled={isSubmittingAddVoter || isPending || isConfirming}
            >
              {isSubmittingAddVoter || isPending || isConfirming
                ? "Ajout en cours..."
                : "Ajouter"}
            </Button>
          </div>
        )}

        {/* Section Changement Workflow */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="workflowAction">Changer l'état du workflow</Label>
          <select
            id="workflowAction"
            className="rounded border border-gray-300 px-3 py-2"
            value={workflowAction}
            onChange={(e) =>
              setWorkflowAction(
                e.target.value as
                  | "startProposalsRegistering"
                  | "endProposalsRegistering"
                  | "startVotingSession"
                  | "endVotingSession"
                  | "tallyVotes"
                  | ""
              )
            }
            disabled={isPending || isConfirming}
          >
            <option value="">-- Sélectionnez une action --</option>
            <option value="startProposalsRegistering">
              Démarrer l'enregistrement des propositions
            </option>
            <option value="endProposalsRegistering">
              Terminer l'enregistrement des propositions
            </option>
            <option value="startVotingSession">
              Démarrer la session de vote
            </option>
            <option value="endVotingSession">
              Terminer la session de vote
            </option>
            <option value="tallyVotes">Comptabiliser les votes</option>
          </select>
          <Button
            onClick={submitWorkflowChange}
            disabled={!workflowAction || isPending || isConfirming}
          >
            {isPending || isConfirming ? "Traitement..." : "Valider"}
          </Button>
        </div>

        {/* Affichage erreurs */}
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
