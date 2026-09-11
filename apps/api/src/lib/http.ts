import type { FailureReason } from "@gravae/shared";

export class AppError extends Error {
  reason?: FailureReason;

  constructor(
    message: string,
    readonly statusCode: number = 400,
    readonly notify: boolean = true,
  ) {
    super(message);
    this.name = new.target.name;
  }

  having(reason: FailureReason) {
    this.reason = reason;
    return this;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Não encontrado") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão") {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito") {
    super(message, 409, false);
  }
}
