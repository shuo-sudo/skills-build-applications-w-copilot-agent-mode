import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        const data = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(data.leaderboard ?? []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLeaderboard([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." items={leaderboard} isLoading={isLoading} error={error} emptyMessage="No leaderboard." renderItem={(entry) => <span>#{entry.rank ?? '?'} {entry.teamName ?? 'Team'} — {entry.totalPoints ?? 0} pts</span>} />;
}
