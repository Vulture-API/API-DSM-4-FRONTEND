/** Projeção do catálogo tipo_sensor do Dicionário de Dados; não é um DTO de API. */
export interface Parameter {
  id: number;
  nome: string;
  unidade_medida: string;
  fator: number | null;
  ganho: number | null;
}

export type ParameterValues = Omit<Parameter, "id">;
