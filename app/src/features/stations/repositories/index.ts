import { ApiStationRepository } from "./ApiStationRepository";
import { MockStationRepository } from "./MockStationRepository";
import type { StationRepository } from "./StationRepository";

export const stationRepository: StationRepository =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  (process.env.NODE_ENV === "test" &&
    process.env.NEXT_PUBLIC_USE_MOCK !== "false")
    ? new MockStationRepository()
    : new ApiStationRepository();
