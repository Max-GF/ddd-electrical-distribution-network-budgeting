import { PaginationParams } from "src/core/repositories/pagination-params";
import { UtilityPole } from "../../enterprise/entities/utility-pole";

export interface FetchWithFilterOptions {
  codes?: number[];
  description?: string;
  minimumCountForLowVoltageLevels?: number;
  minimumCountForMediumVoltageLevels?: number;
}

export abstract class UtilityPolesRepository {
  abstract createMany(bases: UtilityPole[]): Promise<void>;
  abstract save(base: UtilityPole): Promise<void>;
  abstract findById(id: string): Promise<UtilityPole | null>;
  abstract findByCode(code: number): Promise<UtilityPole | null>;
  abstract findAllCodes(): Promise<number[]>;
  abstract fetchWithFilter(
    filterOptions: FetchWithFilterOptions,
    paginationParams: PaginationParams,
  ): Promise<UtilityPole[]>;
}
