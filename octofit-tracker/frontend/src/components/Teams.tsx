import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const data = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (!active) return;
        setTeams(data.teams ?? []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTeams([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." items={teams} isLoading={isLoading} error={error} emptyMessage="No teams." renderItem={(team) => <span>{team.name ?? 'Team'} ({(team.members ?? []).join(', ') || 'No members'})</span>} />;
}
