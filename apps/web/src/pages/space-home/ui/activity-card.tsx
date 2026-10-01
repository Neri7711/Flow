import type { Activity } from "@/entities/activity";
import { type User, UserAvatar } from "@/entities/user";
import { formatRelative } from "@/shared/lib/format-date";
import { Card, CardTitle } from "@/shared/ui/card";

type ActivityCardProps = {
  activity: readonly Activity[];
  users: readonly User[];
};

export function ActivityCard({ activity, users }: ActivityCardProps) {
  return (
    <Card>
      <CardTitle className="mb-1.5">Actividad</CardTitle>

      {activity.length === 0 && <p className="border-t border-subtle py-3 text-sm text-ink-muted">Sin actividad reciente.</p>}

      {activity.map((item) => {
        const actor = users.find((user) => user.id === item.actorId);
        if (!actor) return null;

        return (
          <div key={item.id} className="flex gap-3 border-t border-subtle py-2.5">
            <UserAvatar user={actor} size={28} ring />
            <div className="flex flex-col gap-[3px]">
              <span className="text-sm leading-[1.4]">
                <b className="font-semibold">{actor.shortName}</b> {item.summary}
              </span>
              <span className="font-mono text-[10px] tracking-[0.06em] text-ink-muted uppercase">
                {formatRelative(item.at)}
              </span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
