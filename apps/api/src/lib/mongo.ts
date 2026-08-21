/**
 * No MongoDB, "campo ausente" e "campo com null" sao estados diferentes — e o
 * Prisma nao grava campos opcionais que nunca receberam valor. Consequencia:
 * um filtro `where: { deletedAt: null }` NAO encontra os registros criados sem
 * esse campo, e a consulta volta vazia sem erro nenhum.
 *
 * Este helper cobre os dois estados. Use-o em qualquer filtro de campo opcional
 * usado como flag (soft delete, revogacao, etc).
 */
export const unset = <K extends string>(field: K) =>
  ({ OR: [{ [field]: null }, { [field]: { isSet: false } }] }) as {
    OR: [Record<K, null>, Record<K, { isSet: false }>];
  };
