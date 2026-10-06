import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./shared/prisma-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter));

  const webOrigin = config.get<string>("WEB_ORIGIN", "http://localhost:3000");
  app.enableCors({ origin: webOrigin.split(",").map((origin) => origin.trim()) });

  const port = config.get<string>("PORT", "4000");
  await app.listen(port);
  Logger.log(`Flow API listening on http://localhost:${port}/api`, "Bootstrap");
}

void bootstrap();
