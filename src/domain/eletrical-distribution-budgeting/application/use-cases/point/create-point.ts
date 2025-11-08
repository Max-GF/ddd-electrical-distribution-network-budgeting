import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { Point } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/point";
import { CablesRepository } from "../../repositories/cables-repository";
import { PointsRepository } from "../../repositories/points-repository";
import { ProjectsRepository } from "../../repositories/projects-repository";
import { UtilityPolesRepository } from "../../repositories/utility-poles-repository";

export interface CreatePointUseCaseRequest {
  name: string;
  description?: string;
  projectId: string;
  mediumTensionEntranceCableId?: string;
  mediumTensionExitCableId?: string;
  lowTensionEntranceCableId?: string;
  lowTensionExitCableId?: string;
  utilityPoleId?: string;
}

type CreatePointUseCaseResponse = Either<
  AlreadyRegisteredError | ResourceNotFoundError,
  {
    point: Point;
  }
>;

@Injectable()
export class CreatePointUseCase {
  constructor(
    private pointsRepository: PointsRepository,
    private projectsRepository: ProjectsRepository,
    private utilityPolesRepository: UtilityPolesRepository,
    private cablesRepository: CablesRepository,
  ) {}

  async execute({
    name,
    projectId,
    description,
    lowTensionEntranceCableId,
    lowTensionExitCableId,
    mediumTensionEntranceCableId,
    mediumTensionExitCableId,
    utilityPoleId,
  }: CreatePointUseCaseRequest): Promise<CreatePointUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId);
    if (!project) {
      return left(new ResourceNotFoundError("Project does not exist"));
    }

    const nameAlreadyRegisted =
      await this.pointsRepository.findByNameAndProjectId(name, projectId);

    if (nameAlreadyRegisted) {
      return left(
        new AlreadyRegisteredError(
          "Point name already registered in this project",
        ),
      );
    }
    if (utilityPoleId) {
      const utilityPole =
        await this.utilityPolesRepository.findById(utilityPoleId);
      if (!utilityPole) {
        return left(new ResourceNotFoundError("Utility pole does not exist"));
      }
    }
    const cablesIds = [
      lowTensionEntranceCableId,
      lowTensionExitCableId,
      mediumTensionEntranceCableId,
      mediumTensionExitCableId,
    ].filter((id) => id !== undefined);
    if (cablesIds.length > 0) {
      const cablesExistenceChecks =
        await this.cablesRepository.findByIds(cablesIds);

      if (cablesExistenceChecks.length !== cablesIds.length) {
        const setOfCableExistingIds = new Set(
          cablesExistenceChecks.map((cable) => cable.id.toString()),
        );
        const missingCableIds = cablesIds.filter(
          (id) => !setOfCableExistingIds.has(id),
        );
        return left(
          new ResourceNotFoundError(
            `Cables not found: ${missingCableIds.join(", ")}`,
          ),
        );
      }
    }

    const point = Point.create({
      name,
      projectId: new UniqueEntityID(projectId),
      description,
      lowTensionEntranceCableId: new UniqueEntityID(lowTensionEntranceCableId),
      lowTensionExitCableId: new UniqueEntityID(lowTensionExitCableId),
      mediumTensionEntranceCableId: new UniqueEntityID(
        mediumTensionEntranceCableId,
      ),
      mediumTensionExitCableId: new UniqueEntityID(mediumTensionExitCableId),
      utilityPoleId: new UniqueEntityID(utilityPoleId),
    });
    await this.pointsRepository.createMany([point]);
    return right({
      point,
    });
  }
}
