import { Entity } from "src/core/entities/entity";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";

export interface ProjectMaterialProps {
  projectId: UniqueEntityID;
  materialId: UniqueEntityID;
  quantity: number;
  pointId?: UniqueEntityID; // if not provided, it's considered a untied item
  groupId?: UniqueEntityID;
}

export class ProjectMaterial extends Entity<ProjectMaterialProps> {
  static create(props: ProjectMaterialProps, id?: UniqueEntityID) {
    const projectMaterial = new ProjectMaterial(props, id);
    return projectMaterial;
  }
  get projectId(): UniqueEntityID {
    return this.props.projectId;
  }
  set projectId(projectId: UniqueEntityID) {
    this.props.projectId = projectId;
  }

  get pointId(): UniqueEntityID | undefined {
    return this.props.pointId;
  }
  set pointId(pointId: UniqueEntityID | undefined) {
    this.props.pointId = pointId;
  }
  get materialId(): UniqueEntityID {
    return this.props.materialId;
  }
  set materialId(materialId: UniqueEntityID) {
    this.props.materialId = materialId;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  set quantity(quantity: number) {
    this.props.quantity = quantity;
  }
  get groupId(): UniqueEntityID | undefined {
    return this.props.groupId;
  }
  set groupId(groupId: UniqueEntityID | undefined) {
    this.props.groupId = groupId;
  }
}
