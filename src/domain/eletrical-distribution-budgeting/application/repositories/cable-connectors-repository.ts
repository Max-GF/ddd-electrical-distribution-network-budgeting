import {
  PaginationParams,
  PaginationResponseParams,
} from "src/core/repositories/pagination-params";
import { CableConnector } from "../../enterprise/entities/cable-connectors";

export interface FetchCableConnectorsFilterOptions {
  codes?: number[];
  description?: string;

  entranceMinValueMM?: number;
  entranceMaxValueMM?: number;

  exitMinValueMM?: number;
  exitMaxValueMM?: number;
}

export abstract class CableConnectorsRepository {
  abstract createMany(bases: CableConnector[]): Promise<void>;
  abstract save(base: CableConnector): Promise<void>;
  abstract findById(id: string): Promise<CableConnector | null>;
  abstract findByCode(code: number): Promise<CableConnector | null>;
  abstract findAllCodes(): Promise<number[]>;
  abstract fetchWithFilter(
    filterOptions: FetchCableConnectorsFilterOptions,
    paginationParams: PaginationParams,
  ): Promise<{
    cableConnectors: CableConnector[];
    pagination: PaginationResponseParams;
  }>;
}
