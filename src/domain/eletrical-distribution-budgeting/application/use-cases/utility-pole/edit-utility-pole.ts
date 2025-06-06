import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { NegativeScrewLengthError } from "src/core/errors/erros-eletrical-distribution-budgeting/negative-screw-enum-error";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { UtilityPole } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/utility-pole";
import { UtilityPolesRepository } from "../../repositories/utility-poles-repository";

interface EditUtilityPoleUseCaseRequest {
  utilityPoleId: string;
  description?: string;

  strongSideSectionMultiplier?: number;

  mediumVoltageLevelsCount?: number;
  mediumVoltageStartSectionLengthInCm?: number;
  mediumVoltageSectionLengthAddBylevelInCm?: number;

  lowVoltageLevelsCount?: number;
  lowVoltageStartSectionLengthInCm?: number;
  lowVoltageSectionLengthAddBylevelInCm?: number;
}

type EditUtilityPoleUseCaseResponse = Either<
  | AlreadyRegisteredError
  | ResourceNotFoundError
  | NotAllowedError
  | NegativeScrewLengthError,
  {
    utilityPole: UtilityPole;
  }
>;

@Injectable()
export class EditUtilityPoleUseCase {
  constructor(private utilityPolesRepository: UtilityPolesRepository) {}

  async execute(
    editUtilityPoleUseCaseRequest: EditUtilityPoleUseCaseRequest,
  ): Promise<EditUtilityPoleUseCaseResponse> {
    let hasToEdit = false;

    if (this.noEntries(editUtilityPoleUseCaseRequest)) {
      return left(new NotAllowedError("No entries provided"));
    }
    if (this.oneLengthInfoIsLessThanZero(editUtilityPoleUseCaseRequest)) {
      return left(
        new NegativeScrewLengthError(
          "One or more section length values are less than zero",
        ),
      );
    }

    const {
      utilityPoleId,
      description,
      strongSideSectionMultiplier,
      mediumVoltageLevelsCount,
      mediumVoltageStartSectionLengthInCm,
      mediumVoltageSectionLengthAddBylevelInCm,
      lowVoltageLevelsCount,
      lowVoltageStartSectionLengthInCm,
      lowVoltageSectionLengthAddBylevelInCm,
    } = editUtilityPoleUseCaseRequest;

    const utilityPoleToEdit =
      await this.utilityPolesRepository.findById(utilityPoleId);

    if (!utilityPoleToEdit) {
      return left(
        new ResourceNotFoundError("Given utility pole was not found"),
      );
    }

    if (description && description !== utilityPoleToEdit.description) {
      utilityPoleToEdit.description = description.toUpperCase();
      hasToEdit = true;
    }

    if (
      strongSideSectionMultiplier &&
      strongSideSectionMultiplier !==
        utilityPoleToEdit.strongSideSectionMultiplier
    ) {
      utilityPoleToEdit.strongSideSectionMultiplier =
        strongSideSectionMultiplier;
      hasToEdit = true;
    }
    if (
      mediumVoltageLevelsCount &&
      mediumVoltageLevelsCount !== utilityPoleToEdit.mediumVoltageLevelsCount
    ) {
      utilityPoleToEdit.mediumVoltageLevelsCount = mediumVoltageLevelsCount;
      hasToEdit = true;
    }
    if (
      mediumVoltageStartSectionLengthInCm &&
      mediumVoltageStartSectionLengthInCm !==
        utilityPoleToEdit.mediumVoltageStartSectionLengthInCm
    ) {
      utilityPoleToEdit.mediumVoltageStartSectionLengthInCm =
        mediumVoltageStartSectionLengthInCm;
      hasToEdit = true;
    }
    if (
      mediumVoltageSectionLengthAddBylevelInCm &&
      mediumVoltageSectionLengthAddBylevelInCm !==
        utilityPoleToEdit.mediumVoltageSectionLengthAddBylevelInCm
    ) {
      utilityPoleToEdit.mediumVoltageSectionLengthAddBylevelInCm =
        mediumVoltageSectionLengthAddBylevelInCm;
      hasToEdit = true;
    }
    if (
      lowVoltageLevelsCount &&
      lowVoltageLevelsCount !== utilityPoleToEdit.lowVoltageLevelsCount
    ) {
      utilityPoleToEdit.lowVoltageLevelsCount = lowVoltageLevelsCount;
      hasToEdit = true;
    }
    if (
      lowVoltageStartSectionLengthInCm &&
      lowVoltageStartSectionLengthInCm !==
        utilityPoleToEdit.lowVoltageStartSectionLengthInCm
    ) {
      utilityPoleToEdit.lowVoltageStartSectionLengthInCm =
        lowVoltageStartSectionLengthInCm;
      hasToEdit = true;
    }
    if (
      lowVoltageSectionLengthAddBylevelInCm &&
      lowVoltageSectionLengthAddBylevelInCm !==
        utilityPoleToEdit.lowVoltageSectionLengthAddBylevelInCm
    ) {
      utilityPoleToEdit.lowVoltageSectionLengthAddBylevelInCm =
        lowVoltageSectionLengthAddBylevelInCm;
      hasToEdit = true;
    }

    if (hasToEdit) {
      await this.utilityPolesRepository.save(utilityPoleToEdit);
    }
    return right({
      utilityPole: utilityPoleToEdit,
    });
  }

  noEntries(
    editUtilityPoleUseCaseRequest: EditUtilityPoleUseCaseRequest,
  ): boolean {
    return Object.entries(editUtilityPoleUseCaseRequest)
      .filter(([key]) => key !== "utilityPoleId")
      .every(([, value]) => value === undefined);
  }
  oneLengthInfoIsLessThanZero(
    editUtilityPoleUseCaseRequest: EditUtilityPoleUseCaseRequest,
  ): boolean {
    return Object.entries(editUtilityPoleUseCaseRequest)
      .filter(([key]) => key !== "utilityPoleId" && key !== "description")
      .some(([, value]) => value < 0);
  }
}
