import { Controller, Get } from "@nestjs/common";

import { Public } from "./auth/session";

@Public()
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return { status: "ok", service: "flow-api", at: new Date().toISOString() };
  }
}
