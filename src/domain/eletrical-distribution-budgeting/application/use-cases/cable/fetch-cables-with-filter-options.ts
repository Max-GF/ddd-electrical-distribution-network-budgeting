import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { PaginationResponseParams } from "src/core/repositories/pagination-params";
import { Cable } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/cable";
import { TensionLevel } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/value-objects/tension-level";
import { CablesRepository } from "../../repositories/cables-repository";

interface FetchWithFilterCableUseCaseRequest {
  codes?: number[];
  description?: string;

  tension?: string;
  maxSectionAreaInMM?: number;
  minSectionAreaInMM?: number;

  page?: number;
  perPage?: number;
}

type FetchWithFilterCableUseCaseResponse = Either<
  NotAllowedError,
  {
    cables: Cable[];
    pagination: PaginationResponseParams;
  }
>;

@Injectable()
export class FetchWithFilterCableUseCase {
  constructor(private cablesRepository: CablesRepository) {}

  async execute({
    codes,
    description,
    tension,
    maxSectionAreaInMM,
    minSectionAreaInMM,
    page,
    perPage,
  }: FetchWithFilterCableUseCaseRequest): Promise<FetchWithFilterCableUseCaseResponse> {
    const upperCasedTension = tension ? tension.toUpperCase() : undefined;
    if (
      upperCasedTension !== undefined &&
      !TensionLevel.isValid(upperCasedTension)
    ) {
      return left(
        new NotAllowedError(
          `Invalid tension level: ${tension}. Valid values are: ${TensionLevel.VALID_VALUES.join(", ")}.`,
        ),
      );
    }

    const { cables, pagination } = await this.cablesRepository.fetchWithFilter(
      {
        codes,
        description,
        tension: upperCasedTension,
        maxSectionAreaInMM,
        minSectionAreaInMM,
      },
      {
        page: page ?? 1,
        perPage: perPage ?? 40,
      },
    );
    return right({
      cables,
      pagination,
    });
  }
}
