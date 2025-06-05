import { Entity } from "src/core/entities/entity";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";

export interface PoleScrewProps {
  companyId: UniqueEntityID;
  code: number;
  description: string;

  lengthInCm: number;
}

export class PoleScrew extends Entity<PoleScrewProps> {
  static create(props: PoleScrewProps, id?: UniqueEntityID) {
    const poleScrew = new PoleScrew(props, id);
    return poleScrew;
  }
  get companyId(): UniqueEntityID {
    return this.props.companyId;
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
  get lengthInCm(): number {
    return this.props.lengthInCm;
  }
  set lengthInCm(lengthInCm: number) {
    this.props.lengthInCm = lengthInCm;
  }
}
