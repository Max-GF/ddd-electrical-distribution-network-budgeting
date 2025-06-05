import { Entity } from "src/core/entities/entity";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";

export interface UtilityPoleProps {
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

export class UtilityPole extends Entity<UtilityPoleProps> {
  static create(props: UtilityPoleProps, id?: UniqueEntityID) {
    const utilitypole = new UtilityPole(props, id);
    return utilitypole;
  }
  get code(): number {
    return this.props.code;
  }
  get description(): string {
    return this.props.description;
  }
  set description(description: string) {
    this.props.description = description;
  }
  get strongSideSectionMultiplier(): number {
    return this.props.strongSideSectionMultiplier;
  }
  set strongSideSectionMultiplier(strongSideSectionMultiplier: number) {
    this.props.strongSideSectionMultiplier = strongSideSectionMultiplier;
  }
  get mediumVoltageLevelsCount(): number {
    return this.props.mediumVoltageLevelsCount;
  }
  set mediumVoltageLevelsCount(mediumVoltageLevelsCount: number) {
    this.props.mediumVoltageLevelsCount = mediumVoltageLevelsCount;
  }
  get mediumVoltageStartSectionLengthInCm(): number {
    return this.props.mediumVoltageStartSectionLengthInCm;
  }
  set mediumVoltageStartSectionLengthInCm(
    mediumVoltageStartSectionLengthInCm: number,
  ) {
    this.props.mediumVoltageStartSectionLengthInCm =
      mediumVoltageStartSectionLengthInCm;
  }
  get mediumVoltageSectionLengthAddBylevelInCm(): number {
    return this.props.mediumVoltageSectionLengthAddBylevelInCm;
  }
  set mediumVoltageSectionLengthAddBylevelInCm(
    mediumVoltageSectionLengthAddBylevelInCm: number,
  ) {
    this.props.mediumVoltageSectionLengthAddBylevelInCm =
      mediumVoltageSectionLengthAddBylevelInCm;
  }
  get lowVoltageLevelsCount(): number {
    return this.props.lowVoltageLevelsCount;
  }
  set lowVoltageLevelsCount(lowVoltageLevelsCount: number) {
    this.props.lowVoltageLevelsCount = lowVoltageLevelsCount;
  }
  get lowVoltageStartSectionLengthInCm(): number {
    return this.props.lowVoltageStartSectionLengthInCm;
  }
  set lowVoltageStartSectionLengthInCm(
    lowVoltageStartSectionLengthInCm: number,
  ) {
    this.props.lowVoltageStartSectionLengthInCm =
      lowVoltageStartSectionLengthInCm;
  }
  get lowVoltageSectionLengthAddBylevelInCm(): number {
    return this.props.lowVoltageSectionLengthAddBylevelInCm;
  }
  set lowVoltageSectionLengthAddBylevelInCm(
    lowVoltageSectionLengthAddBylevelInCm: number,
  ) {
    this.props.lowVoltageSectionLengthAddBylevelInCm =
      lowVoltageSectionLengthAddBylevelInCm;
  }
}
