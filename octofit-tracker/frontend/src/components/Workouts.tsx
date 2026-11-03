import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      try {
        const data = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!active) return;
        setSuggestions(data.suggestions ?? []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSuggestions([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." items={suggestions} isLoading={isLoading} error={error} emptyMessage="No workout suggestions." renderItem={(suggestion) => <span>{suggestion.title ?? 'Workout'} — {suggestion.reason ?? 'No reason provided'}</span>} />;
}
