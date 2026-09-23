import { MockParameterRepository } from "./MockParameterRepository";
import type { ParameterRepository } from "./ParameterRepository";

export const parameterRepository: ParameterRepository =
  new MockParameterRepository();
