import {
  PaginationParams,
  PaginationResponseParams,
} from "src/core/repositories/pagination-params";
import { CableConnector } from "../../enterprise/entities/cable-connectors";
import { TensionLevelEntries } from "../../enterprise/entities/value-objects/tension-level";

export interface FetchCableConnectorsWithFilterOptions {
  codes?: number[];
  description?: string;
  tension?: TensionLevelEntries;
  maxSectionAreaInMM?: number;
  minSectionAreaInMM?: number;
}

export abstract class CableConnectorsRepository {
  abstract createMany(bases: CableConnector[]): Promise<void>;
  abstract save(base: CableConnector): Promise<void>;
  abstract findById(id: string): Promise<CableConnector | null>;
  abstract findByCode(code: number): Promise<CableConnector | null>;
  abstract findAllCodes(): Promise<number[]>;
  abstract fetchWithFilter(
    filterOptions: FetchCableConnectorsWithFilterOptions,
    paginationParams: PaginationParams,
  ): Promise<{
    cableconnectors: CableConnector[];
    pagination: PaginationResponseParams;
  }>;
}
