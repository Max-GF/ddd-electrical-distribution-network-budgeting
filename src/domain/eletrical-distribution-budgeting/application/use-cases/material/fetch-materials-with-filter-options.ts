import { Injectable } from "@nestjs/common";
import { Either, right } from "src/core/either";
import { PaginationResponseParams } from "src/core/repositories/pagination-params";
import { Material } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/material";
import { MaterialsRepository } from "../../repositories/materials-repository";

interface FetchWithFilterMaterialsUseCaseRequest {
  codes?: number[];
  description?: string;

  page?: number;
  perPage?: number;
}

type FetchWithFilterMaterialsUseCaseResponse = Either<
  never,
  {
    materials: Material[];
    pagination: PaginationResponseParams;
  }
>;

@Injectable()
export class FetchWithFilterMaterialsUseCase {
  constructor(private materialsRepository: MaterialsRepository) {}

  async execute({
    codes,
    description,
    page,
    perPage,
  }: FetchWithFilterMaterialsUseCaseRequest): Promise<FetchWithFilterMaterialsUseCaseResponse> {
    const { materials, pagination } =
      await this.materialsRepository.fetchWithFilter(
        {
          codes,
          description: description?.toUpperCase(),
        },
        {
          page: page ?? 1,
          perPage: perPage ?? 40,
        },
      );
    return right({
      materials,
      pagination,
    });
  }
}
