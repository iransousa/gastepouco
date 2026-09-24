import type { PrismaClient } from '@prisma/client';

/**
 * Apaga um usuário de teste — e **só** se houver um id.
 *
 * Isto existe por causa de um incidente real neste repositório: um teste fazia
 *
 *   afterEach(() => prisma.user.deleteMany({ where: { id: userId } }))
 *
 * e o `beforeAll` falhou por um erro de injeção. Com o `beforeAll` quebrado, o
 * `beforeEach` nunca rodou, `userId` ficou `undefined` — e o Prisma trata
 * `undefined` como "filtro não informado", ou seja, **apagou todos os
 * usuários do banco**, levando o seed junto.
 *
 * A lição não é "tomar cuidado": é que a limpeza de teste nunca deve aceitar
 * um filtro que possa virar "tudo". Toda remoção de dado em teste passa por
 * aqui.
 */
export async function apagarUsuarioDeTeste(
  prisma: PrismaClient,
  id: string | undefined | null,
): Promise<void> {
  if (!id) return;
  await prisma.user.deleteMany({ where: { id } });
}

/** Mesma proteção para uma lista de ids. */
export async function apagarUsuariosDeTeste(
  prisma: PrismaClient,
  ids: Array<string | undefined | null>,
): Promise<void> {
  const validos = ids.filter((id): id is string => Boolean(id));
  if (validos.length === 0) return;
  await prisma.user.deleteMany({ where: { id: { in: validos } } });
}
