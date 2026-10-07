import { createParamDecorator, type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

/** The signed-in user, attached to every authenticated request by `AuthGuard`. */
export type SessionUser = {
  id: string;
  teamId: string;
  role: UserRole;
};

export type AuthenticatedRequest = { user?: SessionUser; headers: Record<string, string | string[] | undefined> };

export const IS_PUBLIC = "isPublic";

/** Opts a route out of authentication. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Injects the signed-in user into a controller method. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): SessionUser => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) throw new Error("CurrentUser used on a public route");
  return request.user;
});
