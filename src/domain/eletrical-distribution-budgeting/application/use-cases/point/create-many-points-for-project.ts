import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { Point } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/point";
import { CablesRepository } from "../../repositories/cables-repository";
import { PointsRepository } from "../../repositories/points-repository";
import { ProjectsRepository } from "../../repositories/projects-repository";
import { UtilityPolesRepository } from "../../repositories/utility-poles-repository";
import { CreatePointUseCaseRequest } from "./create-point";

type CreateManyPointsForProjectUseCaseResponse = Either<
  AlreadyRegisteredError | ResourceNotFoundError | NotAllowedError,
  {
    points: Point[];
  }
>;

@Injectable()
export class CreateManyPointsForProjectUseCase {
  constructor(
    private pointsRepository: PointsRepository,
    private projectsRepository: ProjectsRepository,
    private utilityPolesRepository: UtilityPolesRepository,
    private cablesRepository: CablesRepository,
  ) {}

  async execute(
    createManyPointsForProjectUseCaseRequest: CreatePointUseCaseRequest[],
  ): Promise<CreateManyPointsForProjectUseCaseResponse> {
    const projectsIdsChecks = await this.checkAllProjectsIds(
      createManyPointsForProjectUseCaseRequest.map((point) => point.projectId),
    );
    if (projectsIdsChecks.isLeft()) {
      return left(projectsIdsChecks.value);
    }

    const pointsNamesChecks = await this.checkAllPointsNamesInProjects(
      createManyPointsForProjectUseCaseRequest,
    );
    if (pointsNamesChecks.isLeft()) {
      return left(pointsNamesChecks.value);
    }

    const utilityPolesChecks = await this.checkAllUtilityPoles(
      createManyPointsForProjectUseCaseRequest
        .map((point) => point.utilityPoleId)
        .filter((id) => id !== undefined),
    );

    if (utilityPolesChecks.isLeft()) {
      return left(utilityPolesChecks.value);
    }

    const cableChecks = await this.checkAllCables(
      createManyPointsForProjectUseCaseRequest
        .map((point) => {
          return [
            point.lowTensionEntranceCableId,
            point.lowTensionExitCableId,
            point.mediumTensionEntranceCableId,
            point.mediumTensionExitCableId,
          ];
        })
        .flat()
        .filter((id) => id !== undefined),
    );

    if (cableChecks.isLeft()) {
      return left(cableChecks.value);
    }

    const points = createManyPointsForProjectUseCaseRequest.map((point) =>
      Point.create({
        name: point.name,
        projectId: new UniqueEntityID(point.projectId),
        description: point.description,
        lowTensionEntranceCableId: new UniqueEntityID(
          point.lowTensionEntranceCableId,
        ),
        lowTensionExitCableId: new UniqueEntityID(point.lowTensionExitCableId),
        mediumTensionEntranceCableId: new UniqueEntityID(
          point.mediumTensionEntranceCableId,
        ),
        mediumTensionExitCableId: new UniqueEntityID(
          point.mediumTensionExitCableId,
        ),
        utilityPoleId: new UniqueEntityID(point.utilityPoleId),
      }),
    );
    await this.pointsRepository.createMany(points);
    return right({
      points,
    });
  }

  async checkAllProjectsIds(
    projectsIds: string[],
  ): Promise<Either<ResourceNotFoundError, undefined>> {
    const projectId = projectsIds[0];
    if (projectsIds.some((id) => id !== projectId)) {
      return left(
        new NotAllowedError(`All points must belong to the same project`),
      );
    }
    const foundProject = await this.projectsRepository.findById(projectId);
    if (!foundProject) {
      return left(new ResourceNotFoundError("Project does not exist"));
    }
    return right(undefined);
  }

  async checkAllPointsNamesInProjects(
    pointsData: CreatePointUseCaseRequest[],
  ): Promise<Either<AlreadyRegisteredError | NotAllowedError, undefined>> {
    const setNameCheck = new Set<string>();
    for (const pointData of pointsData) {
      const key = pointData.name;
      if (setNameCheck.has(key)) {
        return left(
          new NotAllowedError(`Duplicate point name '${key}' in the request`),
        );
      }
      setNameCheck.add(key);
    }
    const projectPoints = await this.pointsRepository.findAllByProjectId(
      pointsData[0].projectId,
    );
    if (
      projectPoints.length > 0 &&
      projectPoints.some((point) => setNameCheck.has(point.name))
    ) {
      return left(
        new AlreadyRegisteredError(`Point name already registered in project`),
      );
    }

    return right(undefined);
  }
  async checkAllUtilityPoles(
    utilityPolesIds: string[],
  ): Promise<Either<ResourceNotFoundError, undefined>> {
    const uniqueUtilityPolesIds = Array.from(new Set(utilityPolesIds)).filter(
      (id) => id !== undefined,
    );
    const foundUtilityPoles = await this.utilityPolesRepository.findByIds(
      uniqueUtilityPolesIds,
    );
    if (foundUtilityPoles.length !== uniqueUtilityPolesIds.length) {
      const setOfUtilityPoleExistingIds = new Set(
        foundUtilityPoles.map((pole) => pole.id.toString()),
      );
      const missingUtilityPoleIds = uniqueUtilityPolesIds.filter(
        (id) => !setOfUtilityPoleExistingIds.has(id),
      );
      return left(
        new ResourceNotFoundError(
          `Utility poles not found: ${missingUtilityPoleIds.join(", ")}`,
        ),
      );
    }
    return right(undefined);
  }
  async checkAllCables(
    cablesIdsArrays: string[],
  ): Promise<Either<ResourceNotFoundError, undefined>> {
    const uniqueCablesIds = Array.from(new Set(cablesIdsArrays)).filter(
      (id) => id !== undefined,
    );
    const foundCables = await this.cablesRepository.findByIds(uniqueCablesIds);
    if (foundCables.length !== uniqueCablesIds.length) {
      const setOfCableExistingIds = new Set(
        foundCables.map((cable) => cable.id.toString()),
      );
      const missingCableIds = uniqueCablesIds.filter(
        (id) => !setOfCableExistingIds.has(id),
      );
      return left(
        new ResourceNotFoundError(
          `Cables not found: ${missingCableIds.join(", ")}`,
        ),
      );
    }
    return right(undefined);
  }
}
