import { Entity } from "src/core/entities/entity";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";
import { TensionLevel } from "./value-objects/tension-level";

export interface GroupProps {
  description: string;
  tension: TensionLevel;
}

export class Material extends Entity<GroupProps> {
  static create(props: GroupProps, id?: UniqueEntityID) {
    const groupMaterial = new Material(props, id);
    return groupMaterial;
  }
  get description(): string {
    return this.props.description;
  }
  set description(description: string) {
    this.props.description = description;
  }
  get tension(): TensionLevel {
    return this.props.tension;
  }
  set tension(tension: TensionLevel) {
    this.props.tension = tension;
  }
}
