import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { makeCable } from "test/factories/eletrical-distribution-budgeting/make-cable";
import { makeProject } from "test/factories/eletrical-distribution-budgeting/make-project";
import { makeUtilityPole } from "test/factories/eletrical-distribution-budgeting/make-utility-pole";
import { InMemoryCablesRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-cables-repository";
import { InMemoryPointsRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-points-repository";
import { InMemoryProjectsRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-projects-repository";
import { InMemoryUtilityPolesRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-utility-poles-repository";
import { CreateManyPointsForProjectUseCase } from "./create-many-points-for-project";
import { CreatePointUseCaseRequest } from "./create-point";

let inMemoryPointsRepository: InMemoryPointsRepository;
let inMemoryProjectsRepository: InMemoryProjectsRepository;
let inMemoryUtilityPolesRepository: InMemoryUtilityPolesRepository;
let inMemoryCablesRepository: InMemoryCablesRepository;
let sut: CreateManyPointsForProjectUseCase;

describe("Create Many Points for Project", () => {
  beforeEach(() => {
    inMemoryProjectsRepository = new InMemoryProjectsRepository();
    inMemoryUtilityPolesRepository = new InMemoryUtilityPolesRepository();
    inMemoryCablesRepository = new InMemoryCablesRepository();
    inMemoryPointsRepository = new InMemoryPointsRepository(
      inMemoryCablesRepository,
      inMemoryProjectsRepository,
      inMemoryUtilityPolesRepository,
    );
    sut = new CreateManyPointsForProjectUseCase(
      inMemoryPointsRepository,
      inMemoryProjectsRepository,
      inMemoryUtilityPolesRepository,
      inMemoryCablesRepository,
    );
  });

  it("should be able to create many points for a project", async () => {
    const project = makeProject();
    const utilityPole = makeUtilityPole();
    const cable1 = makeCable();
    const cable2 = makeCable();
    const cable3 = makeCable();
    const cable4 = makeCable();

    await Promise.all([
      inMemoryProjectsRepository.createMany([project]),
      inMemoryUtilityPolesRepository.createMany([utilityPole]),
      inMemoryCablesRepository.createMany([cable1, cable2, cable3, cable4]),
    ]);

    const pointsToCreate: CreatePointUseCaseRequest[] = [];
    for (let i = 0; i < 5; i++) {
      pointsToCreate.push({
        name: `Point ${i}`,
        projectId: project.id.toString(),
        description: `Description for Point ${i}`,
        utilityPoleId: utilityPole.id.toString(),
        lowTensionEntranceCableId: cable1.id.toString(),
        lowTensionExitCableId: cable2.id.toString(),
        mediumTensionEntranceCableId: cable3.id.toString(),
        mediumTensionExitCableId: cable4.id.toString(),
      });
    }

    const result = await sut.execute(pointsToCreate);

    expect(result.isRight()).toBeTruthy();
    expect(inMemoryPointsRepository.items).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      expect(inMemoryPointsRepository.items[i].name).toBe(`Point ${i}`);
      expect(inMemoryPointsRepository.items[i].description).toBe(
        `Description for Point ${i}`,
      );
      expect(inMemoryPointsRepository.items[i].utilityPoleId?.toString()).toBe(
        utilityPole.id.toString(),
      );
      expect(
        inMemoryPointsRepository.items[i].lowTensionEntranceCableId?.toString(),
      ).toBe(cable1.id.toString());
      expect(
        inMemoryPointsRepository.items[i].lowTensionExitCableId?.toString(),
      ).toBe(cable2.id.toString());
      expect(
        inMemoryPointsRepository.items[
          i
        ].mediumTensionEntranceCableId?.toString(),
      ).toBe(cable3.id.toString());
      expect(
        inMemoryPointsRepository.items[i].mediumTensionExitCableId?.toString(),
      ).toBe(cable4.id.toString());
    }
  });

  it("should not create points if project does not exist", async () => {
    const result = await sut.execute([
      { name: "Point 1", projectId: "non-existing-project" },
    ]);

    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toBe("Project does not exist");
    }
  });

  it("should not create points if they do not belong to the same project", async () => {
    const project1 = makeProject();
    const project2 = makeProject();
    inMemoryProjectsRepository.createMany([project1, project2]);

    const result = await sut.execute([
      { name: "Point 1", projectId: project1.id.toString() },
      { name: "Point 2", projectId: project2.id.toString() },
    ]);

    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError);
      expect(result.value.message).toBe(
        "All points must belong to the same project",
      );
    }
  });

  it("should not create points with duplicate names in the request", async () => {
    const project = makeProject();
    inMemoryProjectsRepository.createMany([project]);

    const result = await sut.execute([
      { name: "Duplicate Name", projectId: project.id.toString() },
      { name: "Duplicate Name", projectId: project.id.toString() },
    ]);

    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError);
      expect(result.value.message).toBe(
        "Duplicate point name 'Duplicate Name' in the request",
      );
    }
  });

  it("should not create points if a name already exists in the project", async () => {
    const project = makeProject();
    inMemoryProjectsRepository.createMany([project]);
    await sut.execute([
      { name: "Existing Point", projectId: project.id.toString() },
    ]);

    const result = await sut.execute([
      { name: "New Point", projectId: project.id.toString() },
      { name: "Existing Point", projectId: project.id.toString() },
    ]);

    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AlreadyRegisteredError);
      expect(result.value.message).toBe(
        "Point name already registered in project",
      );
    }
  });

  it("should not be able to create points with unexisting utility poles", async () => {
    const project = makeProject();
    const cable1 = makeCable();
    const cable2 = makeCable();
    const cable3 = makeCable();
    const cable4 = makeCable();

    await Promise.all([
      inMemoryProjectsRepository.createMany([project]),
      inMemoryCablesRepository.createMany([cable1, cable2, cable3, cable4]),
    ]);

    const pointsToCreate: CreatePointUseCaseRequest[] = [];
    for (let i = 0; i < 5; i++) {
      pointsToCreate.push({
        name: `Point ${i}`,
        projectId: project.id.toString(),
        description: `Description for Point ${i}`,
        utilityPoleId: `non-existing-utility-pole-${i}`,
        lowTensionEntranceCableId: cable1.id.toString(),
        lowTensionExitCableId: cable2.id.toString(),
        mediumTensionEntranceCableId: cable3.id.toString(),
        mediumTensionExitCableId: cable4.id.toString(),
      });
    }

    const result = await sut.execute(pointsToCreate);
    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toBe(
        "Utility poles not found: non-existing-utility-pole-0, non-existing-utility-pole-1, non-existing-utility-pole-2, non-existing-utility-pole-3, non-existing-utility-pole-4",
      );
    }
  });
  it("should not be able to create points with unexisting cables", async () => {
    const project = makeProject();
    const utilityPole = makeUtilityPole();
    const cable1 = makeCable();
    const cable2 = makeCable();
    const cable3 = makeCable();

    await Promise.all([
      inMemoryProjectsRepository.createMany([project]),
      inMemoryUtilityPolesRepository.createMany([utilityPole]),
      inMemoryCablesRepository.createMany([cable1, cable2, cable3]),
    ]);

    const pointsToCreate: CreatePointUseCaseRequest[] = [];
    for (let i = 0; i < 5; i++) {
      pointsToCreate.push({
        name: `Point ${i}`,
        projectId: project.id.toString(),
        description: `Description for Point ${i}`,
        utilityPoleId: utilityPole.id.toString(),
        lowTensionEntranceCableId: "non-existing-cable-2",
        lowTensionExitCableId: cable2.id.toString(),
        mediumTensionEntranceCableId: cable3.id.toString(),
        mediumTensionExitCableId: "non-existing-cable",
      });
    }

    const result = await sut.execute(pointsToCreate);
    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toBe(
        "Cables not found: non-existing-cable-2, non-existing-cable",
      );
    }
  });
});
