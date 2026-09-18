import type { Cargo, User } from "../types/user";

const criado_em = "2026-09-01T09:00:00";

export const cargos: Cargo[] = [
  { id: 1, nome: "ADMIN", descricao: null, criado_em },
  { id: 2, nome: "GERENTE", descricao: null, criado_em },
  { id: 3, nome: "CLIENTE", descricao: null, criado_em },
];

export const users: User[] = [
  { id: 1, nome: "João pé de feijão", cargo_id: 1, ativo: true, criado_em },
  { id: 2, nome: "Maria do Bairro", cargo_id: 2, ativo: false, criado_em },
  { id: 3, nome: "João Maria", cargo_id: 3, ativo: false, criado_em },
  { id: 4, nome: "João da Leste", cargo_id: 3, ativo: true, criado_em },
  { id: 5, nome: "Maria Garça", cargo_id: 2, ativo: false, criado_em },
  { id: 6, nome: "João da Soja", cargo_id: 3, ativo: true, criado_em },
];

/** Apenas os campos públicos necessários da relação credenciais. */
export const publicCredentials: { usuario_id: number; email: string }[] = [
  { usuario_id: 1, email: "joao.feijao@example.com" },
  { usuario_id: 2, email: "maria.bairro@example.com" },
  { usuario_id: 3, email: "joao.maria@example.com" },
  { usuario_id: 4, email: "joao.leste@example.com" },
  { usuario_id: 5, email: "maria.garca@example.com" },
  { usuario_id: 6, email: "joao.soja@example.com" },
];
