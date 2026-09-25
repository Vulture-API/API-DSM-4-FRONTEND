import { ApiAlertRepository } from "./ApiAlertRepository";
import type { AlertRepository } from "./AlertRepository";
import { MockAlertRepository } from "./MockAlertRepository";

export const alertRepository: AlertRepository =
  process.env.NEXT_PUBLIC_USE_MOCK === "true"
    ? new MockAlertRepository()
    : new ApiAlertRepository();

export * from "./AlertRepository";
export * from "./ApiAlertRepository";
export * from "./MockAlertRepository";
