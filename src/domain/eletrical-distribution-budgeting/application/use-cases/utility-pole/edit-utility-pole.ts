import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { UtilityPole } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/utility-pole";
import { UtilityPolesRepository } from "../../repositories/utility-poles-repository";

interface EditUtilityPoleUseCaseRequest {
  utilityPodeId: string;
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
  AlreadyRegisteredError | ResourceNotFoundError | NotAllowedError,
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
    if (this.oneScrewEnumIsLessThanZero(editUtilityPoleUseCaseRequest)) {
      return left(
        new NotAllowedError("One or more screw enum values are less than zero"),
      );
    }

    const {
      utilityPodeId,
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
      await this.utilityPolesRepository.findById(utilityPodeId);

    if (!utilityPoleToEdit) {
      return left(new ResourceNotFoundError("Given utility pole not found"));
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
      .filter(([key]) => key !== "utilityPodeId")
      .every(([, value]) => value === undefined);
  }
  oneScrewEnumIsLessThanZero(
    editUtilityPoleUseCaseRequest: EditUtilityPoleUseCaseRequest,
  ): boolean {
    return Object.entries(editUtilityPoleUseCaseRequest)
      .filter(([key]) => key !== "utilityPodeId" && key !== "description")
      .some(([, value]) => value < 0);
  }
}
