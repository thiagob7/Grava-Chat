/**
 * Erros de domínio. Os services lançam estes; a camada HTTP e a de socket
 * traduzem para status/mensagem. É o que permite um service não saber nada
 * sobre Fastify — e ser testável sem subir servidor.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = new.target.name;
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
    super(message, 409);
  }
}
