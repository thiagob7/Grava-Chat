import type { MotivoDeFalha } from "@gravae/shared";

export class AppError extends Error {
  motivo?: MotivoDeFalha;

  constructor(
    message: string,
    readonly statusCode: number = 400,
    readonly avisar: boolean = true,
  ) {
    super(message);
    this.name = new.target.name;
  }

  com(motivo: MotivoDeFalha) {
    this.motivo = motivo;
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
