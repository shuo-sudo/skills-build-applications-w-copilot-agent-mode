import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        const data = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (!active) return;
        setActivities(data.activities ?? []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setActivities([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadActivities();
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points." items={activities} isLoading={isLoading} error={error} emptyMessage="No activities." renderItem={(activity) => <span>{activity.type ?? 'Activity'} ({activity.minutes ?? 0} min, {activity.points ?? 0} pts)</span>} />;
}
