import type { Parameter, ParameterValues } from "../types/parameter";

export interface ParameterRepository {
  list(): Promise<Parameter[]>;
  create(values: ParameterValues): Promise<Parameter>;
  update(id: number, values: ParameterValues): Promise<Parameter>;
  remove(id: number): Promise<void>;
}
