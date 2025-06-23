import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VotingEvent } from "@/components/shared/VotingForm";

export default function Event({ events }: { events: VotingEvent[] }) {
  if (!events.length) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Liste des Événements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Aucun événement à afficher.</div>
        </CardContent>
      </Card>
    );
  }

  const getBadgeColor = (type: VotingEvent["type"]) => {
    switch (type) {
      case "VoterRegistered":
        return "bg-green-500";
      case "ProposalRegistered":
        return "bg-blue-500";
      case "WorkflowStatusChange":
        return "bg-yellow-500";
      case "Voted":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Liste des Événements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-3">
          {events.map((event) => (
            <Card key={crypto.randomUUID()} className="mb-1 p-4">
              <div className="flex flex-col gap-1">
                <Badge className={getBadgeColor(event.type)}>
                  {event.type}
                </Badge>
                <div className="text-sm text-gray-700">
                  {event.type === "VoterRegistered" && (
                    <p>
                      ✅ <strong>Adresse inscrite :</strong>{" "}
                      {event.voterAddress}
                    </p>
                  )}
                  {event.type === "WorkflowStatusChange" && (
                    <p>
                      🔄 <strong>Statut :</strong> {event.previousStatus} ➡️{" "}
                      {event.newStatus}
                    </p>
                  )}
                  {event.type === "ProposalRegistered" && (
                    <p>
                      📝 <strong>ID de la proposition :</strong>{" "}
                      {event.proposalId}
                    </p>
                  )}
                  {event.type === "Voted" && (
                    <p>
                      🗳️ <strong>Votant :</strong> {event.voter} <br />
                      🧾 <strong>Proposition :</strong> {event.proposalId}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Bloc : #{event.blockNumber}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
