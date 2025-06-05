import { Injectable } from "@nestjs/common";
import { Either, right } from "src/core/either";
import { NegativeScrewEnumError } from "src/core/errors/erros-eletrical-distribution-budgeting/negative-screw-enum-error";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { UtilityPole } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/utility-pole";
import { UtilityPolesRepository } from "../../repositories/utility-poles-repository";

interface CreateOneUtilityPoleUseCaseDTO {
  code: number;
  description: string;

  strongSideSectionMultiplier: number;

  mediumVoltageLevelsCount: number;
  mediumVoltageStartSectionLengthInCm: number;
  mediumVoltageSectionLengthAddBylevelInCm: number;

  lowVoltageLevelsCount: number;
  lowVoltageStartSectionLengthInCm: number;
  lowVoltageSectionLengthAddBylevelInCm: number;
}

interface CreateBulkOfUtilityPolesUseCaseRequest {
  utilityPolesToCreate: CreateOneUtilityPoleUseCaseDTO[];
}
interface FailedLog {
  error: AlreadyRegisteredError | NegativeScrewEnumError;
  utilityPole: CreateOneUtilityPoleUseCaseDTO;
}

type CreateBulkOfUtilityPolesUseCaseResponse = Either<
  never,
  {
    failed: FailedLog[];
    created: UtilityPole[];
  }
>;

@Injectable()
export class CreateBulkOfUtilityPolesUseCase {
  constructor(private utilityPolesRepository: UtilityPolesRepository) {}

  async execute({
    utilityPolesToCreate,
  }: CreateBulkOfUtilityPolesUseCaseRequest): Promise<CreateBulkOfUtilityPolesUseCaseResponse> {
    if (utilityPolesToCreate.length === 0) {
      return right({ failed: [], created: [] });
    }
    const failed: FailedLog[] = [];
    const created: UtilityPole[] = [];
    const actualCodesInRepository =
      await this.utilityPolesRepository.findAllCodes();

    for (const utilityPoleToCreate of utilityPolesToCreate) {
      if (this.oneScrewEnumIsLessThanZero(utilityPoleToCreate)) {
        failed.push({
          error: new NegativeScrewEnumError(
            "One or more screw enums are less than zero",
          ),
          utilityPole: utilityPoleToCreate,
        });
        continue;
      }
      const { code, description, ...othersProps } = utilityPoleToCreate;
      if (actualCodesInRepository.includes(code)) {
        failed.push({
          error: new AlreadyRegisteredError(
            "UtilityPole code already registered",
          ),
          utilityPole: utilityPoleToCreate,
        });
        continue;
      }
      const utilityPole = UtilityPole.create({
        code,
        description: description.toUpperCase(),
        ...othersProps,
      });
      created.push(utilityPole);
    }
    if (created.length === 0) {
      return right({ failed, created: [] });
    }
    await this.utilityPolesRepository.createMany(created);
    return right({
      failed,
      created,
    });
  }
  oneScrewEnumIsLessThanZero(
    utilityPoleToCreate: CreateOneUtilityPoleUseCaseDTO,
  ): boolean {
    return Object.entries(utilityPoleToCreate)
      .filter(([key]) => key !== "code" && key !== "description")
      .some(([, value]) => value < 0);
  }
}
