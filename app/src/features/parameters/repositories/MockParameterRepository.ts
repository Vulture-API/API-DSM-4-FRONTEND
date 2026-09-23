import { parameters } from "../mocks/parameters";
import { parameterSchema } from "../schemas/parameterSchema";
import type { Parameter, ParameterValues } from "../types/parameter";
import type { ParameterRepository } from "./ParameterRepository";

/** Estado em memória durante a sessão; recarregar a página restaura os exemplos. */
export class MockParameterRepository implements ParameterRepository {
  private items: Parameter[];
  private nextId: number;

  constructor(seed: Parameter[] = parameters) {
    this.items = seed.map((item) => ({ ...item }));
    this.nextId = Math.max(0, ...seed.map((item) => item.id)) + 1;
  }
  async list() {
    return this.items.map((item) => ({ ...item }));
  }
  async create(values: ParameterValues) {
    const parsed = parameterSchema(this.items).parse(values);
    const item = { ...parsed, id: this.nextId++ };
    this.items.push(item);
    return { ...item };
  }
  async update(id: number, values: ParameterValues) {
    const index = this.findIndex(id);
    const parsed = parameterSchema(this.items, id).parse(values);
    this.items[index] = { ...parsed, id };
    return { ...this.items[index] };
  }
  async remove(id: number) {
    this.items.splice(this.findIndex(id), 1);
  }
  private findIndex(id: number) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Parâmetro não encontrado.");
    return index;
  }
}
