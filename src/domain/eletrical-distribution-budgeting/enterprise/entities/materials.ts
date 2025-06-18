import { Entity } from "src/core/entities/entity";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";

export interface CableConnectorProps {
  code: number;
  description: string;
  unit: string;
}

export class CableConnector extends Entity<CableConnectorProps> {
  static create(props: CableConnectorProps, id?: UniqueEntityID) {
    const cable = new CableConnector(props, id);
    return cable;
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
  get unit(): string {
    return this.props.unit;
  }
  set unit(value: string) {
    this.props.unit = value;
  }
}
