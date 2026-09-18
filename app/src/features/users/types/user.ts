/** Campos persistidos da tabela usuarios, conforme o Dicionário de Dados. */
export interface User {
  id: number;
  cargo_id: number;
  nome: string;
  ativo: boolean;
  criado_em: string;
}

export interface Cargo {
  id: number;
  nome: string;
  descricao: string | null;
  criado_em: string;
}

/** Projeção para leitura; nunca inclui senha_hash. Não representa um DTO de API. */
export interface UserListItem extends User {
  email: string | null;
  cargo: Pick<Cargo, "id" | "nome">;
}
