import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the JWT-validated user object into a controller parameter */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);
