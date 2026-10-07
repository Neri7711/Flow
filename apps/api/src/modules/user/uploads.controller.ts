import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import type { Response } from "express";

import { Public } from "@/auth/session";
import { avatarsDir } from "@/shared/uploads";

/** Names the API itself generates (`<userId>-<hex>.<ext>`): nothing else can be requested. */
const AVATAR_FILE = /^[\w-]+\.(png|jpg|webp)$/;

/** Public: profile photos are shown as plain images. */
@Public()
@Controller("uploads")
export class UploadsController {
  @Get("avatars/:file")
  avatar(@Param("file") file: string, @Res() response: Response) {
    if (!AVATAR_FILE.test(file)) throw new NotFoundException();
    response.sendFile(file, { root: avatarsDir(), maxAge: "7d", immutable: true }, (error) => {
      if (error && !response.headersSent) response.status(404).json({ statusCode: 404, message: "Not Found" });
    });
  }
}
