import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { ProjectDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

const include = {
  milestones: { orderBy: { position: "asc" } },
  areas: { orderBy: { position: "asc" } },
} satisfies Prisma.ProjectInclude;

type ProjectWithRelations = Prisma.ProjectGetPayload<{ include: typeof include }>;

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(teamId: string): Promise<ProjectDto | null> {
    const project = await this.prisma.project.findFirst({ where: { teamId }, orderBy: { id: "asc" }, include });
    return project ? toDto(project) : null;
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
    milestones: project.milestones.map((m) => ({ id: m.id, name: m.name, date: m.date.toISOString() })),
    areas: project.areas.map((a) => ({ name: a.name, progress: a.progress, tone: a.tone })),
  };
}
