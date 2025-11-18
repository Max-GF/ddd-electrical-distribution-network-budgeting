import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { Cable } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/cable";
import { CableConnector } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/cable-connector";
import { Group } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/group";
import {
  GroupCableConnectorProps,
  GroupItem,
  GroupMaterialProps,
  GroupPoleScrewProps,
} from "src/domain/eletrical-distribution-budgeting/enterprise/entities/group-item";
import { Material } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/material";
import { Point } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/point";
import { PoleScrew } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/pole-screw";
import { ProjectMaterial } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/project-material";
import { UtilityPole } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/utility-pole";
import { CableConnectorsRepository } from "../../repositories/cable-connectors-repository";
import { CablesRepository } from "../../repositories/cables-repository";
import { GroupItemsRepository } from "../../repositories/group-items-repository";
import { GroupsRepository } from "../../repositories/groups-repository";
import { MaterialsRepository } from "../../repositories/materials-repository";
import { PointsRepository } from "../../repositories/points-repository";
import { PoleScrewsRepository } from "../../repositories/pole-screws-repository";
import { ProjectsRepository } from "../../repositories/projects-repository";
import { UtilityPolesRepository } from "../../repositories/utility-poles-repository";

export interface CreatePointUseCaseRequest {
  name: string;
  description?: string;
  projectId: string;
  pointUtilityPole: PointUtilityPoleRequest;
  pointCables: PointCablesRequest;
  pointGroups?: PointGroupRequest[];
  untiedMaterials?: { quantity: number; materialId: string }[];
}

interface PointCablesRequest {
  lowTensionCables?: {
    entranceCable: {
      isNew: boolean;
      cableId: string;
    };
    exitCable?: {
      isNew: boolean;
      cableId: string;
    };
  };
  mediumTensionCables?: {
    entranceCable: {
      isNew: boolean;
      cableId: string;
    };
    exitCable?: {
      isNew: boolean;
      cableId: string;
    };
  };
}

interface ParsedPointCables {
  lowTensionCables?: {
    entranceCable: {
      isNew: boolean;
      cable: Cable;
    };
    exitCable?: {
      isNew: boolean;
      cable: Cable;
    };
  };
  mediumTensionCables?: {
    entranceCable: {
      isNew: boolean;
      cable: Cable;
    };
    exitCable?: {
      isNew: boolean;
      cable: Cable;
    };
  };
}
interface PointUtilityPoleRequest {
  isNew: boolean;
  utilityPoleId: string;
}
interface ParsedPointUtilityPole {
  isNew: boolean;
  utilityPole: UtilityPole;
}
interface PointGroupRequest {
  tensionLevel: "LOW" | "MEDIUM";
  level: number;
  groupId: string;
}
interface ParsedPointGroup extends GroupWithSeparatedItems {
  tensionLevel: "LOW" | "MEDIUM";
  level: number;
}

interface GroupWithSeparatedItems {
  group: Group;
  untiedMaterials: GroupItem<GroupMaterialProps>[];
  cableConnectors: GroupItem<GroupCableConnectorProps>[];
  poleScrews: GroupItem<GroupPoleScrewProps>[];
}

type CreatePointUseCaseResponse = Either<
  AlreadyRegisteredError | ResourceNotFoundError,
  {
    point: Point;
    pointMaterials: ProjectMaterial[];
  }
>;

@Injectable()
export class CreatePointUseCase {
  constructor(
    private pointsRepository: PointsRepository,
    private projectsRepository: ProjectsRepository,
    private utilityPolesRepository: UtilityPolesRepository,
    private cablesRepository: CablesRepository,
    private materialsRepository: MaterialsRepository,
    private groupsRepository: GroupsRepository,
    private groupItemsRepository: GroupItemsRepository,
    private poleScrewsRepository: PoleScrewsRepository,
    private cableConnectorsRepository: CableConnectorsRepository,
  ) {}

  async execute({
    name,
    projectId,
    description,
    pointUtilityPole,
    pointCables,
    pointGroups,
    untiedMaterials,
  }: CreatePointUseCaseRequest): Promise<CreatePointUseCaseResponse> {
    /*
    STEPS TO VALIDATE:
    [X] 1 - Check if project exists
    [X] 2 - Check if point name is already registered for the given project
    [X] 3 - If utility pole id is given, check if it exists
    [X] 4 - If groups ids are given, check if they exist
      [X] 4.1 - If groups ids are given, fetch their items
      [X] 4.2 - If groups and utility pole are given, check if utility pole supports the groups levels
    [X] 5 - If cables ids are given, check if they exist
    [X] 6 - If untied materials ids are given, check if they exist
    [ ] 7 - Separar os materiais avulsos, os cabos, e os conectores de todos os grupos;
    [ ] 8 - Somar as quantidades de cada material avulso dos grupos com os materiais avulsos dados na criação do ponto
    [ ] 9- Se tiver conectores de cabo, calcular os conectores necessários para os cabos dados e os cabos dos grupos
    [ ] 10 - Se tiver parafusos de poste e poste, calcular os parafusos necessários para o poste dado e os postes dos grupos
    */

    // #region Step 1
    const project = await this.projectsRepository.findById(projectId);
    if (!project) {
      return left(new ResourceNotFoundError("Project does not exist"));
    }
    // #endregion Step 1

    // #region Step 2
    const nameAlreadyRegisted =
      await this.pointsRepository.findByNameAndProjectId(name, projectId);

    if (nameAlreadyRegisted) {
      return left(
        new AlreadyRegisteredError(
          "Point name already registered in this project",
        ),
      );
    }
    // #endregion Step 2

    // #region Step 3

    const utilityPoleIdChecks = await this.performAllUtilityPoleChecks(
      pointUtilityPole.utilityPoleId,
    );
    if (utilityPoleIdChecks.isLeft()) {
      return left(utilityPoleIdChecks.value);
    }
    const parsedUtilityPole = {
      isNew: pointUtilityPole.isNew,
      utilityPole: utilityPoleIdChecks.value.utilityPole,
    };

    // #endregion Step 3

    // #region Step 4

    const groupsChecks = await this.performAllGroupsChecks(
      pointGroups,
      parsedUtilityPole.utilityPole,
    );
    if (groupsChecks.isLeft()) {
      return left(groupsChecks.value);
    }
    const pointGroupsWithItems = groupsChecks.value;

    // #endregion Step 4

    // #region Step 5

    const cablesChecks = await this.performAllCablesChecks(pointCables);

    if (cablesChecks.isLeft()) {
      return left(cablesChecks.value);
    }
    const parsedCables = cablesChecks.value;

    // #endregion

    // #region Step 6

    const untiedMaterialsChecks =
      await this.performAllUntiedMaterialsChecks(untiedMaterials);
    if (untiedMaterialsChecks.isLeft()) {
      return left(untiedMaterialsChecks.value);
    }
    const pointUntiedMaterials = untiedMaterialsChecks.value;

    // #endregion Step 6

    // #region Step 7

    const ordenedByLengthPoleScrews =
      await this.poleScrewsRepository.getAllOrderedByLength();
    const ordenedByLengthCableConnectors =
      await this.cableConnectorsRepository.getAllOrderedByLength();
    const tempPointId = new UniqueEntityID();
    const budgetMaterialsCalculated = await this.calculatePointMaterials({
      projectId,
      pointId: tempPointId,
      utilityPole: parsedUtilityPole,
      cables: parsedCables,
      pointGroupsWithItems,
      ordenedByLengthCableConnectors,
      ordenedByLengthPoleScrews,
      pointUntiedMaterials,
    });
    if (budgetMaterialsCalculated.isLeft()) {
      return left(budgetMaterialsCalculated.value);
    }
    const { projectMaterials } = budgetMaterialsCalculated.value;

    // #endregion Step 7

    // #region Step 8
    const point = Point.create(
      {
        projectId: new UniqueEntityID(projectId),
        name,
        utilityPoleId: parsedUtilityPole.utilityPole.id,
        description,
        lowTensionEntranceCableId:
          parsedCables.lowTensionCables?.entranceCable.cable.id,
        lowTensionExitCableId:
          parsedCables.lowTensionCables?.exitCable?.cable.id,
        mediumTensionEntranceCableId:
          parsedCables.mediumTensionCables?.entranceCable.cable.id,
        mediumTensionExitCableId:
          parsedCables.mediumTensionCables?.exitCable?.cable.id,
      },
      tempPointId,
    );
    await this.pointsRepository.createMany([point]);

    return right({ point, pointMaterials: projectMaterials });
  }

  async performAllUtilityPoleChecks(
    utilityPoleId: string,
  ): Promise<Either<ResourceNotFoundError, { utilityPole: UtilityPole }>> {
    if (!utilityPoleId) {
      return left(new ResourceNotFoundError("Utility pole ID is required"));
    }
    const utilityPole =
      await this.utilityPolesRepository.findById(utilityPoleId);
    if (!utilityPole) {
      return left(new ResourceNotFoundError("Utility pole does not exist"));
    }
    return right({ utilityPole });
  }

  async performAllCablesChecks(
    pointCables: PointCablesRequest,
  ): Promise<Either<ResourceNotFoundError, ParsedPointCables>> {
    const cablesIds = [
      pointCables.lowTensionCables?.entranceCable.cableId,
      pointCables.lowTensionCables?.exitCable?.cableId,
      pointCables.mediumTensionCables?.entranceCable.cableId,
      pointCables.mediumTensionCables?.exitCable?.cableId,
    ].filter((cable) => cable !== undefined);

    const cables = await this.cablesRepository.findByIds(cablesIds);
    const mapOfCableExistingIds = new Map<string, Cable>(
      cables.map((cable) => [cable.id.toString(), cable]),
    );
    if (cables.length !== cablesIds.length) {
      const missingCableIds = cablesIds.filter(
        (id) => !mapOfCableExistingIds.has(id),
      );
      return left(
        new ResourceNotFoundError(
          `Cables not found: ${missingCableIds.join(", ")}`,
        ),
      );
    }
    return right({
      lowTensionCables: pointCables.lowTensionCables
        ? {
            entranceCable: {
              isNew: pointCables.lowTensionCables.entranceCable.isNew,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              cable: mapOfCableExistingIds.get(
                pointCables.lowTensionCables.entranceCable.cableId,
              )!,
            },
            exitCable: pointCables.lowTensionCables.exitCable
              ? {
                  isNew: pointCables.lowTensionCables.exitCable.isNew,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  cable: mapOfCableExistingIds.get(
                    pointCables.lowTensionCables.exitCable.cableId,
                  )!,
                }
              : undefined,
          }
        : undefined,
      mediumTensionCables: pointCables.mediumTensionCables
        ? {
            entranceCable: {
              isNew: pointCables.mediumTensionCables.entranceCable.isNew,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              cable: mapOfCableExistingIds.get(
                pointCables.mediumTensionCables.entranceCable.cableId,
              )!,
            },
            exitCable: pointCables.mediumTensionCables.exitCable
              ? {
                  isNew: pointCables.mediumTensionCables.exitCable.isNew,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  cable: mapOfCableExistingIds.get(
                    pointCables.mediumTensionCables.exitCable.cableId,
                  )!,
                }
              : undefined,
          }
        : undefined,
    });
  }

  async performAllUntiedMaterialsChecks(
    untiedMaterials?: { quantity: number; materialId: string }[],
  ): Promise<
    Either<ResourceNotFoundError, { quantity: number; material: Material }[]>
  > {
    if (!untiedMaterials || untiedMaterials.length === 0) {
      return right([]);
    }
    const untiedMaterialIds = untiedMaterials.map((mat) => mat.materialId);
    const materials =
      await this.materialsRepository.findByIds(untiedMaterialIds);
    const mapOfFoundedMaterials = new Map<string, Material>(
      materials.map((material) => [material.id.toString(), material]),
    );
    if (materials.length !== untiedMaterialIds.length) {
      const missingMaterialIds = untiedMaterialIds.filter(
        (id) => !mapOfFoundedMaterials.has(id),
      );
      return left(
        new ResourceNotFoundError(
          `Materials not found: ${missingMaterialIds.join(", ")}`,
        ),
      );
    }
    const result = untiedMaterials.map((untiedMat) => {
      return {
        quantity: untiedMat.quantity,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        material: mapOfFoundedMaterials.get(untiedMat.materialId)!,
      };
    });
    return right(result);
  }

  async performAllGroupsChecks(
    pointGroups: PointGroupRequest[] | undefined,
    utilityPole: UtilityPole,
  ): Promise<
    Either<ResourceNotFoundError | NotAllowedError, ParsedPointGroup[]>
  > {
    if (!pointGroups || pointGroups.length === 0) {
      return right([]);
    }

    const lowTensionGroups: PointGroupRequest[] = [];
    const mediumTensionGroups: PointGroupRequest[] = [];
    const groupsIdsToSet = new Set<string>();
    const groupsLowLevelsSet = new Set<number>();
    const groupsMediumLevelsSet = new Set<number>();

    for (const group of pointGroups) {
      if (group.tensionLevel === "LOW") {
        lowTensionGroups.push(group);
      } else if (group.tensionLevel === "MEDIUM") {
        mediumTensionGroups.push(group);
      }
      groupsIdsToSet.add(group.groupId);
      if (group.tensionLevel === "LOW") {
        if (groupsLowLevelsSet.has(group.level)) {
          return left(
            new NotAllowedError(
              `Duplicate low tension group level ${group.level} found`,
            ),
          );
        }
        groupsLowLevelsSet.add(group.level);
      } else if (group.tensionLevel === "MEDIUM") {
        if (groupsMediumLevelsSet.has(group.level)) {
          return left(
            new NotAllowedError(
              `Duplicate medium tension group level ${group.level} found`,
            ),
          );
        }
        groupsMediumLevelsSet.add(group.level);
      }
    }
    const groupsIdsToSearch = Array.from(groupsIdsToSet);

    if (
      lowTensionGroups.length > utilityPole.lowVoltageLevelsCount ||
      lowTensionGroups.some(
        (pointGroup) => pointGroup.level > utilityPole.lowVoltageLevelsCount,
      )
    ) {
      return left(
        new NotAllowedError(
          "Utility pole does not support all low voltage levels required by the groups",
        ),
      );
    }
    if (
      mediumTensionGroups.length > utilityPole.mediumVoltageLevelsCount ||
      mediumTensionGroups.some(
        (pointGroup) => pointGroup.level > utilityPole.mediumVoltageLevelsCount,
      )
    ) {
      return left(
        new NotAllowedError(
          "Utility pole does not support all medium voltage levels required by the groups",
        ),
      );
    }
    const foundedGroups =
      await this.groupsRepository.findByIds(groupsIdsToSearch);
    const mapOfFoundedGroupIds = new Map<string, Group>(
      foundedGroups.map((group) => [group.id.toString(), group]),
    );
    if (foundedGroups.length !== groupsIdsToSearch.length) {
      const missingGroupIds = groupsIdsToSearch.filter(
        (id) => !mapOfFoundedGroupIds.has(id),
      );
      return left(
        new ResourceNotFoundError(
          `Groups not found: ${missingGroupIds.join(", ")}`,
        ),
      );
    }
    const groupsItems =
      await this.groupItemsRepository.findByManyGroupsIds(groupsIdsToSearch);

    const result: ParsedPointGroup[] = [];

    for (const pointGroup of pointGroups) {
      const groupUntiedMaterials: GroupItem<GroupMaterialProps>[] = [];
      const groupCableConnectors: GroupItem<GroupCableConnectorProps>[] = [];
      const groupPoleScrews: GroupItem<GroupPoleScrewProps>[] = [];

      groupsItems.forEach((item) => {
        if (item.groupId.toString() !== pointGroup.groupId) {
          return;
        }
        if (item.isMaterial()) {
          groupUntiedMaterials.push(item);
        } else if (item.isCableConnector()) {
          groupCableConnectors.push(item);
        } else if (item.isPoleScrew()) {
          groupPoleScrews.push(item);
        }
      });

      const respectiveGroup = mapOfFoundedGroupIds.get(pointGroup.groupId);

      if (!respectiveGroup) {
        return left(
          new ResourceNotFoundError(
            "Internal error: Group mapping failed. This should not happen.",
          ),
        );
      }

      result.push({
        tensionLevel: pointGroup.tensionLevel,
        level: pointGroup.level,
        group: respectiveGroup,
        untiedMaterials: groupUntiedMaterials,
        cableConnectors: groupCableConnectors,
        poleScrews: groupPoleScrews,
      });
    }
    return right(result);
  }

  async calculatePointMaterials({
    projectId,
    utilityPole,
    pointGroupsWithItems,
    pointId,
    cables,
    ordenedByLengthCableConnectors,
    ordenedByLengthPoleScrews,
    pointUntiedMaterials,
  }: {
    projectId: string;
    utilityPole: ParsedPointUtilityPole;
    pointGroupsWithItems: ParsedPointGroup[];
    pointId: UniqueEntityID;
    cables: ParsedPointCables;
    ordenedByLengthCableConnectors: CableConnector[];
    ordenedByLengthPoleScrews: PoleScrew[];
    pointUntiedMaterials: { quantity: number; material: Material }[];
  }): Promise<
    Either<ResourceNotFoundError, { projectMaterials: ProjectMaterial[] }>
  > {
    const pointMaterials: ProjectMaterial[] = [];

    // Adiciona os materiais avulsos do ponto (Se houver)
    pointUntiedMaterials.forEach((untiedMaterial) => {
      pointMaterials.push(
        ProjectMaterial.create({
          quantity: untiedMaterial.quantity,
          itemId: untiedMaterial.material.id,
          itemType: "material",
          projectId: new UniqueEntityID(projectId),
          pointId: pointId,
          groupSpecs: undefined,
        }),
      );
    });

    // Adiciona os materiais de cada grupo do ponto
    for (const pointGroup of pointGroupsWithItems) {
      pointGroup.untiedMaterials.forEach((untiedMaterial) => {
        pointMaterials.push(
          ProjectMaterial.create({
            quantity: untiedMaterial.quantity,
            itemId: untiedMaterial.materialId,
            itemType: "material",
            projectId: new UniqueEntityID(projectId),
            pointId: pointId,
            groupSpecs: {
              groupId: pointGroup.group.id,
              utilityPoleLevel: pointGroup.level,
              tensionLevel: pointGroup.tensionLevel,
            },
          }),
        );
      });

      const groupPoleScrews = await this.calculateGroupPoleScrews(
        {
          groupPoleScrews: pointGroup.poleScrews,
          pointUtilityPole: utilityPole,
          tensionLevel: pointGroup.tensionLevel,
          level: pointGroup.level,
          groupId: pointGroup.group.id,
          projectId,
          pointId,
        },
        ordenedByLengthPoleScrews,
      );

      if (groupPoleScrews.isLeft()) {
        return left(groupPoleScrews.value);
      }

      pointMaterials.push(...groupPoleScrews.value);

      const groupCableConnectors = await this.calculateGroupCableConnectors(
        {
          groupCableConnectors: pointGroup.cableConnectors,
          pointCables: cables,
          tensionLevel: pointGroup.tensionLevel,
          level: pointGroup.level,
          groupId: pointGroup.group.id,
          pointId,
          projectId,
        },
        ordenedByLengthCableConnectors,
      );
      if (groupCableConnectors.isLeft()) {
        return left(groupCableConnectors.value);
      }
      pointMaterials.push(...groupCableConnectors.value);
    }

    // Adiciona o poste, se ele for novo
    if (utilityPole.isNew) {
      pointMaterials.push(
        ProjectMaterial.create({
          quantity: 1,
          itemId: utilityPole.utilityPole.id,
          itemType: "utilityPole",
          projectId: new UniqueEntityID(projectId),
          pointId: pointId,
        }),
      );
    }

    // Adiciona os cabos, se eles forem novos
    [
      cables.lowTensionCables?.entranceCable,
      cables.lowTensionCables?.exitCable,
      cables.mediumTensionCables?.entranceCable,
      cables.mediumTensionCables?.exitCable,
    ].forEach((pointCable) => {
      if (pointCable?.isNew) {
        pointMaterials.push(
          ProjectMaterial.create({
            quantity: 1,
            itemId: pointCable.cable.id,
            itemType: "cable",
            projectId: new UniqueEntityID(projectId),
            pointId: pointId,
          }),
        );
      }
    });

    return right({ projectMaterials: pointMaterials });
  }

  async calculateGroupPoleScrews(
    {
      groupId,
      projectId,
      pointId,
      groupPoleScrews,
      pointUtilityPole,
      tensionLevel,
      level,
    }: {
      groupId: UniqueEntityID;
      projectId: string;
      pointId: UniqueEntityID;
      groupPoleScrews: GroupItem<GroupPoleScrewProps>[];
      pointUtilityPole: ParsedPointUtilityPole;
      tensionLevel: "LOW" | "MEDIUM";
      level: number;
    },
    ordenedByLengthPoleScrews: PoleScrew[],
  ): Promise<Either<ResourceNotFoundError, ProjectMaterial[]>> {
    // Lógica para calcular os parafusos de fixação do grupo

    const calculatedGroupPoleScrews: ProjectMaterial[] = [];

    for (const poleScrewItem of groupPoleScrews) {
      const utilityLevelLengthInMM =
        pointUtilityPole.utilityPole.calculateSectionLengthInMM(
          level,
          tensionLevel,
        );
      const suitablePoleScrew = this.findSuitablePoleScrew(
        utilityLevelLengthInMM,
        ordenedByLengthPoleScrews,
      );
      if (!suitablePoleScrew) {
        return left(
          new ResourceNotFoundError(
            `No suitable pole screw found for length ${utilityLevelLengthInMM}mm`,
          ),
        );
      }
      calculatedGroupPoleScrews.push(
        ProjectMaterial.create({
          quantity: poleScrewItem.quantity,
          itemId: suitablePoleScrew.id,
          itemType: "poleScrew",
          projectId: new UniqueEntityID(projectId),
          pointId,
          groupSpecs: {
            groupId,
            utilityPoleLevel: level,
            tensionLevel: tensionLevel,
          },
        }),
      );
    }
    return right(calculatedGroupPoleScrews);
  }
  async calculateGroupCableConnectors(
    {
      groupId,
      projectId,
      pointId,
      groupCableConnectors,
      pointCables,
      tensionLevel,
      level,
    }: {
      groupId: UniqueEntityID;
      projectId: string;
      pointId: UniqueEntityID;
      groupCableConnectors: GroupItem<GroupCableConnectorProps>[];
      pointCables: ParsedPointCables;
      tensionLevel: "LOW" | "MEDIUM";
      level: number;
    },
    ordenedByLengthCableConnectors: CableConnector[],
  ): Promise<
    Either<ResourceNotFoundError | NotAllowedError, ProjectMaterial[]>
  > {
    // Lógica para calcular os conectores de cabo do grupo

    const calculatedGroupCableConnectors: ProjectMaterial[] = [];

    for (const cableConnectorItem of groupCableConnectors) {
      const cablesToUse =
        tensionLevel === "LOW"
          ? pointCables.lowTensionCables
          : pointCables.mediumTensionCables;

      if (!cablesToUse) {
        return left(
          new NotAllowedError(
            `No cables available for tension level ${tensionLevel} to calculate cable connectors`,
          ),
        );
      }
      const requiredEntrance = cablesToUse.entranceCable?.cable.sectionAreaInMM;
      const requiredExit = cableConnectorItem.oneSideConnector
        ? 0
        : cableConnectorItem.localCableSectionInMM ||
          cablesToUse.exitCable?.cable.sectionAreaInMM ||
          0;

      if (requiredExit === 0 && !cableConnectorItem.oneSideConnector) {
        return left(
          new NotAllowedError(
            `Exit cable section is required to calculate cable connector for two-side connectors`,
          ),
        );
      }
      const suitableCableConnector = this.findSuitableCableConnector(
        {
          requiredEntrance,
          requiredExit,
        },
        ordenedByLengthCableConnectors,
      );
      if (!suitableCableConnector) {
        return left(
          new ResourceNotFoundError(
            `No suitable cable connector found for config: Entrance ${requiredEntrance}mm, Exit ${requiredExit}mm`,
          ),
        );
      }
      calculatedGroupCableConnectors.push(
        ProjectMaterial.create({
          quantity: cableConnectorItem.quantity,
          itemId: suitableCableConnector.id,
          itemType: "cableConnector",
          projectId: new UniqueEntityID(projectId),
          pointId,
          groupSpecs: {
            groupId,
            utilityPoleLevel: level,
            tensionLevel: tensionLevel,
          },
        }),
      );
    }
    return right(calculatedGroupCableConnectors);
  }
  private findSuitablePoleScrew(
    requiredLength: number,
    sortedPoleScrews: PoleScrew[],
  ): PoleScrew | null {
    let low = 0;
    let high = sortedPoleScrews.length - 1;
    let bestFit: PoleScrew | null = null;

    while (low <= high) {
      const mid = Math.floor(low + (high - low) / 2);
      const currentScrew = sortedPoleScrews[mid];

      if (currentScrew.lengthInMM >= requiredLength) {
        bestFit = currentScrew;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return bestFit;
  }
  private findSuitableCableConnector(
    {
      requiredEntrance,
      requiredExit,
    }: { requiredEntrance: number; requiredExit: number },
    sortedCableConnectors: CableConnector[],
  ): CableConnector | null {
    const suitableConnectors = sortedCableConnectors.find((connector) => {
      return (
        connector.entranceMinValueMM <= requiredEntrance &&
        requiredEntrance <= connector.entranceMaxValueMM &&
        connector.exitMinValueMM <= requiredExit &&
        requiredExit <= connector.exitMaxValueMM
      );
    });
    return suitableConnectors || null;
  }
}
