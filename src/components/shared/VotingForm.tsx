"use client";

import { useState, useCallback, useEffect } from "react";
import { chainsToVoting, votingAbi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from "wagmi";
import { readContract } from "@wagmi/core";
import { Address, parseAbiItem } from "viem";
import { usePublicClient } from "../hooks/usePublicClient";
import Event from "./Event";
import Proposal from "./Proposal";
import Admin from "./Admin";
import Vote from "./Vote";
import Winner from "./Winner";
import NonVoter from "./NonVoter";
import WorkflowStatus from "./WorkflowStatus";
import type { ProposalType } from "./Proposal";

export type VotingEvent = {
  type:
    | "VoterRegistered"
    | "WorkflowStatusChange"
    | "ProposalRegistered"
    | "Voted";
  voterAddress?: string;
  previousStatus?: number;
  newStatus?: number;
  proposalId?: number;
  voter?: string;
  blockNumber: number;
};

export default function VotingForm() {
  const chainId = useChainId();
  const config = useConfig();
  const publicClient = usePublicClient();
  const votingAddress = chainsToVoting[chainId]?.voting;
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const [events, setEvents] = useState<VotingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [proposals, setProposals] = useState<ProposalType[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [workflowRefreshCount, setWorkflowRefreshCount] = useState(0);
  const [contractExists, setContractExists] = useState<boolean | null>(null);

  const [isVoter, setIsVoter] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<number | null>(null);

  // Nouveau state pour éviter l’erreur d’hydratation
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchWorkflowStatus = useCallback(async () => {
    if (!votingAddress) return;
    try {
      const status = await readContract(config, {
        address: votingAddress as Address,
        abi: votingAbi,
        functionName: "workflowStatus",
      });
      setWorkflowStatus(Number(status));
    } catch (err) {
      console.error("Erreur récupération workflowStatus", err);
    }
  }, [votingAddress, config]);

  const checkIfVoter = useCallback(async () => {
    if (!votingAddress || !address) return;
    try {
      const voter = await readContract(config, {
        address: votingAddress as Address,
        abi: votingAbi,
        functionName: "getVoter",
        args: [address],
        account: address,
      });
      if (voter) {
        setIsVoter(true);
      }
    } catch {
      setIsVoter(false);
    }
  }, [votingAddress, config, address]);

  const checkIfAdmin = useCallback(async () => {
    if (!votingAddress || !address) return;
    try {
      const owner = (await readContract(config, {
        address: votingAddress as Address,
        abi: votingAbi,
        functionName: "owner",
      })) as Address;
      setIsAdmin(owner.toLowerCase() === address.toLowerCase());
    } catch (err) {
      setIsAdmin(false);
    }
  }, [votingAddress, config, address]);

  const getProposalsFromEvents = useCallback(async () => {
    if (!votingAddress || !isVoter) return;

    setLoadingProposals(true);
    try {
      const proposalEvents = await publicClient.getLogs({
        address: votingAddress as Address,
        event: parseAbiItem("event ProposalRegistered(uint256 proposalId)"),
        fromBlock: 8611631n,
        toBlock: "latest",
      });

      const proposalIds = proposalEvents.map((event) =>
        Number(event.args.proposalId)
      );

      const proposalsFetched: (ProposalType | null)[] = await Promise.all(
        proposalIds.map(async (id) => {
          try {
            const proposal = (await readContract(config, {
              address: votingAddress as Address,
              abi: votingAbi,
              functionName: "getOneProposal",
              args: [id],
              account: address as Address,
            })) as { description: string; voteCount: bigint };

            return {
              id,
              description: proposal.description,
              voteCount: Number(proposal.voteCount),
            };
          } catch (error) {
            console.warn(`Impossible de récupérer la proposition ${id}`, error);
            return null;
          }
        })
      );

      setProposals(
        proposalsFetched.filter((p): p is ProposalType => p !== null)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des propositions:", error);
      setProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  }, [votingAddress, config, address, isVoter]);

  const getEvents = useCallback(async () => {
    if (!votingAddress) return;
    setLoadingEvents(true);
    try {
      const voterRegisteredEvents = await publicClient.getLogs({
        address: votingAddress as Address,
        event: parseAbiItem("event VoterRegistered(address voterAddress)"),
        fromBlock: 8611631n,
        toBlock: "latest",
      });

      const workflowStatusChangeEvents = await publicClient.getLogs({
        address: votingAddress as Address,
        event: parseAbiItem(
          "event WorkflowStatusChange(uint8 previousStatus, uint8 newStatus)"
        ),
        fromBlock: 8611631n,
        toBlock: "latest",
      });

      const proposalRegisteredEvents = await publicClient.getLogs({
        address: votingAddress as Address,
        event: parseAbiItem("event ProposalRegistered(uint256 proposalId)"),
        fromBlock: 8611631n,
        toBlock: "latest",
      });

      const votedEvents = await publicClient.getLogs({
        address: votingAddress as Address,
        event: parseAbiItem("event Voted(address voter, uint proposalId)"),
        fromBlock: 8611631n,
        toBlock: "latest",
      });

      const combinedEvents: VotingEvent[] = [
        ...voterRegisteredEvents.map((event) => ({
          type: "VoterRegistered" as const,
          voterAddress: event.args.voterAddress?.toString(),
          blockNumber: Number(event.blockNumber),
        })),
        ...workflowStatusChangeEvents.map((event) => ({
          type: "WorkflowStatusChange" as const,
          previousStatus: Number(event.args.previousStatus),
          newStatus: Number(event.args.newStatus),
          blockNumber: Number(event.blockNumber),
        })),
        ...proposalRegisteredEvents.map((event) => ({
          type: "ProposalRegistered" as const,
          proposalId: Number(event.args.proposalId),
          blockNumber: Number(event.blockNumber),
        })),
        ...votedEvents.map((event) => ({
          type: "Voted" as const,
          voter: event.args.voter?.toString(),
          proposalId: Number(event.args.proposalId),
          blockNumber: Number(event.blockNumber),
        })),
      ];

      const sortedEvents = combinedEvents.sort(
        (a, b) => b.blockNumber - a.blockNumber
      );
      setEvents(sortedEvents);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [votingAddress]);

  async function refetchAll() {
    if (isVoter) {
      await getProposalsFromEvents();
    }

    setWorkflowRefreshCount((c) => c + 1);
    fetchWorkflowStatus();
  }

  useEffect(() => {
    getEvents();
    fetchWorkflowStatus();
    checkIfVoter();
    checkIfAdmin();
  }, [getEvents, fetchWorkflowStatus, checkIfVoter, checkIfAdmin]);

  useEffect(() => {
    if (isVoter) {
      getProposalsFromEvents();
    }
  }, [isVoter, getProposalsFromEvents]);

  // Ne rien afficher avant le montage client
  if (!hasMounted) {
    return null;
  }

  if (!isVoter) {
    return (
      <div>
        <WorkflowStatus refreshSignal={workflowRefreshCount} />
        {isAdmin && (
          <Admin
            refetch={refetchAll}
            getEvents={getEvents}
            workflowStatus={workflowStatus}
          />
        )}

        {!isAdmin && <NonVoter />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WorkflowStatus refreshSignal={workflowRefreshCount} />

      {isAdmin && (
        <Admin
          refetch={refetchAll}
          getEvents={getEvents}
          workflowStatus={workflowStatus}
        />
      )}

      {workflowStatus === 1 && (
        <Proposal
          proposals={proposals}
          loading={loadingProposals}
          refetch={getProposalsFromEvents}
          getEvents={getEvents}
        />
      )}

      {workflowStatus === 3 && (
        <Vote
          proposals={proposals}
          refetch={getProposalsFromEvents}
          getEvents={getEvents}
        />
      )}

      {workflowStatus === 5 && <Winner />}

      <Event events={events} />
    </div>
  );
}
