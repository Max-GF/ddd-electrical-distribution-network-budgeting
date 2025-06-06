import { Injectable } from "@nestjs/common";
import { Either, right } from "src/core/either";
import { NegativeScrewLengthError } from "src/core/errors/erros-eletrical-distribution-budgeting/negative-screw-enum-error";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { PoleScrew } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/pole-screw";
import { PoleScrewsRepository } from "../../repositories/pole-screws-repository";

interface CreateOnePoleScrewUseCaseDTO {
  code: number;
  description: string;

  lengthInCm: number;
}

interface CreateBulkOfPoleScrewsUseCaseRequest {
  poleScrewsToCreate: CreateOnePoleScrewUseCaseDTO[];
}
interface FailedLog {
  error: AlreadyRegisteredError | NegativeScrewLengthError;
  poleScrew: CreateOnePoleScrewUseCaseDTO;
}

type CreateBulkOfPoleScrewsUseCaseResponse = Either<
  never,
  {
    failed: FailedLog[];
    created: PoleScrew[];
  }
>;

@Injectable()
export class CreateBulkOfPoleScrewsUseCase {
  constructor(private poleScrewsRepository: PoleScrewsRepository) {}

  async execute({
    poleScrewsToCreate,
  }: CreateBulkOfPoleScrewsUseCaseRequest): Promise<CreateBulkOfPoleScrewsUseCaseResponse> {
    if (poleScrewsToCreate.length === 0) {
      return right({ failed: [], created: [] });
    }
    const failed: FailedLog[] = [];
    const created: PoleScrew[] = [];
    const actualCodesInRepository = new Set(
      await this.poleScrewsRepository.findAllCodes(),
    );

    for (const poleScrewToCreate of poleScrewsToCreate) {
      if (poleScrewToCreate.lengthInCm <= 0) {
        failed.push({
          error: new NegativeScrewLengthError(
            "Pole Screw length must be greater than zero",
          ),
          poleScrew: poleScrewToCreate,
        });
        continue;
      }
      const { code, description, lengthInCm } = poleScrewToCreate;
      if (actualCodesInRepository.has(code)) {
        failed.push({
          error: new AlreadyRegisteredError(
            "PoleScrew code already registered",
          ),
          poleScrew: poleScrewToCreate,
        });
        continue;
      }
      const poleScrew = PoleScrew.create({
        code,
        description: description.toUpperCase(),
        lengthInCm,
      });
      created.push(poleScrew);
      actualCodesInRepository.add(code);
    }
    if (created.length === 0) {
      return right({ failed, created: [] });
    }
    await this.poleScrewsRepository.createMany(created);
    return right({
      failed,
      created,
    });
  }
}
