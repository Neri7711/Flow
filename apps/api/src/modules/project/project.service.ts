import { Injectable, NotFoundException } from "@nestjs/common";
import type { Milestone, Project, ProjectArea } from "@prisma/client";

import type { ProjectDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

type ProjectWithRelations = Project & { milestones: Milestone[]; areas: ProjectArea[] };

const include = {
  milestones: { orderBy: { position: "asc" } },
  areas: { orderBy: { position: "asc" } },
} as const;

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(teamId: string): Promise<ProjectDto | undefined> {
    const project = await this.prisma.project.findFirst({ where: { teamId }, include });
    return project ? toDto(project) : undefined;
  }

  async findOne(id: string): Promise<ProjectDto> {
    const project = await this.prisma.project.findUnique({ where: { id }, include });
    if (!project) throw new NotFoundException(`Project "${id}" not found`);
    return toDto(project);
  }
}

function toDto(project: ProjectWithRelations): ProjectDto {
  return {
    id: project.id,
    teamId: project.teamId,
    name: project.name,
    milestones: project.milestones.map((m) => ({ id: m.id, name: m.name, date: m.date })),
    areas: project.areas.map((a) => ({ name: a.name, progress: a.progress, tone: a.tone })),
  };
}
