import {
  PaginationParams,
  PaginationResponseParams,
} from "src/core/repositories/pagination-params";
import { Cable } from "../../enterprise/entities/cable";
import { TensionLevelEntries } from "../../enterprise/entities/value-objects/tension-level";

export interface FetchCablesWithFilterOptions {
  codes?: number[];
  description?: string;
  tension?: TensionLevelEntries;
  maxSectionAreaInMM?: number;
  minSectionAreaInMM?: number;
}

export abstract class CablesRepository {
  abstract createMany(bases: Cable[]): Promise<void>;
  abstract save(base: Cable): Promise<void>;
  abstract findById(id: string): Promise<Cable | null>;
  abstract findByCode(code: number): Promise<Cable | null>;
  abstract findAllCodes(): Promise<number[]>;
  abstract fetchWithFilter(
    filterOptions: FetchCablesWithFilterOptions,
    paginationParams: PaginationParams,
  ): Promise<{
    cables: Cable[];
    pagination: PaginationResponseParams;
  }>;
}
