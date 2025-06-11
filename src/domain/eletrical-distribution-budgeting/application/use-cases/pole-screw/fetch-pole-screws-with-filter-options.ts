import { Injectable } from "@nestjs/common";
import { Either, right } from "src/core/either";
import { PaginationResponseParams } from "src/core/repositories/pagination-params";
import { PoleScrew } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/pole-screw";
import { PoleScrewsRepository } from "../../repositories/pole-screws-repository";

interface FetchWithFilterPoleScrewUseCaseRequest {
  codes?: number[];
  description?: string;

  minLengthInMM?: number;
  maxLengthInMM?: number;

  page?: number;
  perPage?: number;
}

type FetchWithFilterPoleScrewUseCaseResponse = Either<
  never,
  {
    poleScrews: PoleScrew[];
    pagination: PaginationResponseParams;
  }
>;

@Injectable()
export class FetchWithFilterPoleScrewUseCase {
  constructor(private poleScrewsRepository: PoleScrewsRepository) {}

  async execute({
    codes,
    description,
    minLengthInMM,
    maxLengthInMM,
    page,
    perPage,
  }: FetchWithFilterPoleScrewUseCaseRequest): Promise<FetchWithFilterPoleScrewUseCaseResponse> {
    const { poleScrews, pagination } =
      await this.poleScrewsRepository.fetchWithFilter(
        {
          codes,
          description,
          minLengthInMM,
          maxLengthInMM,
        },
        {
          page: page ?? 1,
          perPage: perPage ?? 40,
        },
      );
    return right({
      poleScrews,
      pagination,
    });
  }
}
