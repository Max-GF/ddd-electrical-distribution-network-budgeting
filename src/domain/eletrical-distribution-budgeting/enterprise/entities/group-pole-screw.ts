import { Entity } from "src/core/entities/entity";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";

export interface GroupMaterialProps {
  groupId: UniqueEntityID;
  lengthAdd: number;
  quantity: number;
}

export class Material extends Entity<GroupMaterialProps> {
  static create(props: GroupMaterialProps, id?: UniqueEntityID) {
    const groupMaterial = new Material(props, id);
    return groupMaterial;
  }
  get groupId(): UniqueEntityID {
    return this.props.groupId;
  }
  get lengthAdd(): number {
    return this.props.lengthAdd;
  }
  set lengthAdd(lengthAdd: number) {
    this.props.lengthAdd = lengthAdd;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  set quantity(quantity: number) {
    this.props.quantity = quantity;
  }
}
