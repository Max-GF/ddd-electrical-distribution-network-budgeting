import {
  PaginationParams,
  PaginationResponseParams,
} from "src/core/repositories/pagination-params";
import { Material } from "../../enterprise/entities/material";

export interface FetchMaterialsFilterOptions {
  codes?: number[];
  description?: string;
}

export abstract class MaterialsRepository {
  abstract createMany(materials: Material[]): Promise<void>;
  abstract save(material: Material): Promise<void>;
  abstract findById(id: string): Promise<Material | null>;
  abstract findByCode(code: number): Promise<Material | null>;
  abstract findAllCodes(): Promise<number[]>;
  abstract fetchWithFilter(
    filterOptions: FetchMaterialsFilterOptions,
    paginationParams: PaginationParams,
  ): Promise<{
    materials: Material[];
    pagination: PaginationResponseParams;
  }>;
}
