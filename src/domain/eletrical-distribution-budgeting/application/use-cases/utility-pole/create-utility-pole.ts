import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { NegativeScrewLengthError } from "src/core/errors/erros-eletrical-distribution-budgeting/negative-screw-enum-error";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { UtilityPole } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/utility-pole";
import { UtilityPolesRepository } from "../../repositories/utility-poles-repository";

interface CreateUtilityPoleUseCaseRequest {
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

type CreateUtilityPoleUseCaseResponse = Either<
  AlreadyRegisteredError | NegativeScrewLengthError,
  {
    utilityPole: UtilityPole;
  }
>;

@Injectable()
export class CreateUtilityPoleUseCase {
  constructor(private utilityPolesRepository: UtilityPolesRepository) {}

  async execute(
    createUtilityPoleUseCaseRequest: CreateUtilityPoleUseCaseRequest,
  ): Promise<CreateUtilityPoleUseCaseResponse> {
    if (this.oneLengthInfoIsLessThanZero(createUtilityPoleUseCaseRequest)) {
      return left(
        new NegativeScrewLengthError(
          "One or more section length are less than zero",
        ),
      );
    }
    const { code, description, ...otherProps } =
      createUtilityPoleUseCaseRequest;
    const utilityPoleWithSameCode =
      await this.utilityPolesRepository.findByCode(code);
    if (utilityPoleWithSameCode) {
      return left(
        new AlreadyRegisteredError("UtilityPole code already registered"),
      );
    }

    const utilityPole = UtilityPole.create({
      code,
      description: description.toUpperCase(),
      ...otherProps,
    });
    await this.utilityPolesRepository.createMany([utilityPole]);
    return right({
      utilityPole,
    });
  }
  oneLengthInfoIsLessThanZero(
    createUtilityPoleUseCaseRequest: CreateUtilityPoleUseCaseRequest,
  ): boolean {
    return Object.entries(createUtilityPoleUseCaseRequest)
      .filter(([key]) => key !== "code" && key !== "description")
      .some(([, value]) => value < 0);
  }
}
