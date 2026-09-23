import type { Parameter } from "../types/parameter";

export const parameters: Parameter[] = [
  { id: 1, nome: "Temperatura", unidade_medida: "°C", fator: 1, ganho: null },
  { id: 2, nome: "Umidade", unidade_medida: "%", fator: 1, ganho: null },
  {
    id: 3,
    nome: "Velocidade do Vento",
    unidade_medida: "m/s",
    fator: 0.1,
    ganho: 1,
  },
  {
    id: 4,
    nome: "Direção do Vento",
    unidade_medida: "°",
    fator: 1,
    ganho: null,
  },
  {
    id: 5,
    nome: "Índice Pluviométrico",
    unidade_medida: "mm",
    fator: 0.2,
    ganho: 1,
  },
  {
    id: 6,
    nome: "Pressão Atmosférica",
    unidade_medida: "hPa",
    fator: 1,
    ganho: null,
  },
];
