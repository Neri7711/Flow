import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthController } from "./health.controller";
import { ActivityModule } from "./modules/activity/activity.module";
import { CycleModule } from "./modules/cycle/cycle.module";
import { DocumentModule } from "./modules/document/document.module";
import { EventModule } from "./modules/event/event.module";
import { ProjectModule } from "./modules/project/project.module";
import { TaskModule } from "./modules/task/task.module";
import { TeamModule } from "./modules/team/team.module";
import { TriageModule } from "./modules/triage/triage.module";
import { UserModule } from "./modules/user/user.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TeamModule,
    UserModule,
    TaskModule,
    CycleModule,
    ProjectModule,
    DocumentModule,
    EventModule,
    ActivityModule,
    TriageModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
