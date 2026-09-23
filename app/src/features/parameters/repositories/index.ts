import { ApiParameterRepository } from "./ApiParameterRepository";
import { MockParameterRepository } from "./MockParameterRepository";
import type { ParameterRepository } from "./ParameterRepository";

export const parameterRepository: ParameterRepository =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  (process.env.NODE_ENV === "test" &&
    process.env.NEXT_PUBLIC_USE_MOCK !== "false")
    ? new MockParameterRepository()
    : new ApiParameterRepository();

