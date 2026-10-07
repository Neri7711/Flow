import { Module } from "@nestjs/common";

import { CycleSettingsController } from "./cycle-settings.controller";
import { CycleSettingsService } from "./cycle-settings.service";
import { CycleController } from "./cycle.controller";
import { CycleService } from "./cycle.service";

@Module({
  controllers: [CycleController, CycleSettingsController],
  providers: [CycleService, CycleSettingsService],
})
export class CycleModule {}
