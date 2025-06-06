import {
  PaginationParams,
  PaginationResponseParams,
} from "src/core/repositories/pagination-params";
import { PoleScrew } from "../../enterprise/entities/pole-screw";

export interface FetchPoleScrewsWithFilterOptions {
  codes?: number[];
  description?: string;
  minLengthInCm?: number;
  maxLengthInCm?: number;
}

export abstract class PoleScrewsRepository {
  abstract createMany(bases: PoleScrew[]): Promise<void>;
  abstract save(base: PoleScrew): Promise<void>;
  abstract findById(id: string): Promise<PoleScrew | null>;
  abstract findByCode(code: number): Promise<PoleScrew | null>;
  abstract findAllCodes(): Promise<number[]>;
  abstract fetchWithFilter(
    filterOptions: FetchPoleScrewsWithFilterOptions,
    paginationParams: PaginationParams,
  ): Promise<{
    poleScrews: PoleScrew[];
    pagination: PaginationResponseParams;
  }>;
}
