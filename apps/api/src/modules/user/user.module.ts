import { Module } from "@nestjs/common";

import { UploadsController } from "./uploads.controller";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController, UploadsController],
  providers: [UserService],
})
export class UserModule {}
