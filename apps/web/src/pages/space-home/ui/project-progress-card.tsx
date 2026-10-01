import type { Project } from "@/entities/project";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Eyebrow } from "@/shared/ui/eyebrow";

export function ProjectProgressCard({ project }: { project: Project }) {
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <CardTitle>{project.name}</CardTitle>
        <Eyebrow>Progreso</Eyebrow>
      </CardHeader>

      {project.areas.map((area) => (
        <div key={area.name} className="flex flex-col gap-2">
          <div className="flex text-sm">
            <span>{area.name}</span>
            <span className="ml-auto font-mono text-xs text-ink-muted">{area.progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={area.name}
            aria-valuenow={area.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2.5 overflow-hidden rounded-full bg-subtle"
          >
            <div data-team={area.tone} className="h-full rounded-full bg-team" style={{ width: `${area.progress}%` }} />
          </div>
        </div>
      ))}
    </Card>
  );
}
