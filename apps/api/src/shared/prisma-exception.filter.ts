import { ArgumentsHost, Catch, HttpException, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Prisma } from "@prisma/client";

/**
 * Turns the Prisma errors a client can cause into proper HTTP responses
 * instead of a generic 500 (e.g. a payload pointing at a team that doesn't exist).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const http = toHttpException(error);
    super.catch(http ?? error, host);
  }
}

function toHttpException(error: Prisma.PrismaClientKnownRequestError): HttpException | undefined {
  switch (error.code) {
    case "P2002":
      return new HttpException("A record with that identifier already exists", HttpStatus.CONFLICT);
    case "P2003":
      return new HttpException(
        `Referenced record does not exist (${String(error.meta?.field_name ?? "foreign key")})`,
        HttpStatus.BAD_REQUEST,
      );
    case "P2025":
      return new HttpException(String(error.meta?.cause ?? "Record not found"), HttpStatus.NOT_FOUND);
    default:
      return undefined;
  }
}
