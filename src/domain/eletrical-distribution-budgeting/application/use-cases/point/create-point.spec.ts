import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { makeCable } from "test/factories/eletrical-distribution-budgeting/make-cable";
import { makeProject } from "test/factories/eletrical-distribution-budgeting/make-project";
import { makeUtilityPole } from "test/factories/eletrical-distribution-budgeting/make-utility-pole";
import { InMemoryCablesRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-cables-repository";
import { InMemoryPointsRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-points-repository";
import { InMemoryProjectsRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-projects-repository";
import { InMemoryUtilityPolesRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-utility-poles-repository";
import { CreatePointUseCase } from "./create-point";

let inMemoryPointsRepository: InMemoryPointsRepository;
let inMemoryProjectsRepository: InMemoryProjectsRepository;
let inMemoryUtilityPolesRepository: InMemoryUtilityPolesRepository;
let inMemoryCablesRepository: InMemoryCablesRepository;
let sut: CreatePointUseCase;

describe("Create Point", () => {
  beforeEach(() => {
    inMemoryProjectsRepository = new InMemoryProjectsRepository();
    inMemoryUtilityPolesRepository = new InMemoryUtilityPolesRepository();
    inMemoryCablesRepository = new InMemoryCablesRepository();
    inMemoryPointsRepository = new InMemoryPointsRepository(
      inMemoryCablesRepository,
      inMemoryProjectsRepository,
      inMemoryUtilityPolesRepository,
    );
    sut = new CreatePointUseCase(
      inMemoryPointsRepository,
      inMemoryProjectsRepository,
      inMemoryUtilityPolesRepository,
      inMemoryCablesRepository,
    );
  });

  it("should be able to create a point", async () => {
    const project = makeProject();
    inMemoryProjectsRepository.createMany([project]);

    const utilityPole = makeUtilityPole();
    inMemoryUtilityPolesRepository.createMany([utilityPole]);

    const cable1 = makeCable();
    const cable2 = makeCable();
    inMemoryCablesRepository.createMany([cable1, cable2]);

    const result = await sut.execute({
      name: "Point 1",
      projectId: project.id.toString(),
      description: "A description",
      utilityPoleId: utilityPole.id.toString(),
      lowTensionEntranceCableId: cable1.id.toString(),
      lowTensionExitCableId: cable2.id.toString(),
    });

    expect(result.isRight()).toBeTruthy();
    expect(inMemoryPointsRepository.items).toHaveLength(1);
    expect(inMemoryPointsRepository.items[0].name).toBe("Point 1");
    expect(inMemoryPointsRepository.items[0].utilityPoleId?.toString()).toEqual(
      utilityPole.id.toString(),
    );
  });

  it("should not be able to create a point with a non-existing project", async () => {
    const result = await sut.execute({
      name: "Point 1",
      projectId: "non-existing-project",
    });

    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toBe("Project does not exist");
    }
  });

  it("should not be able to create a point with a name that already exists in the project", async () => {
    const project = makeProject();
    inMemoryProjectsRepository.createMany([project]);

    await sut.execute({
      name: "Point 1",
      projectId: project.id.toString(),
    });

    const result = await sut.execute({
      name: "Point 1",
      projectId: project.id.toString(),
    });

    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AlreadyRegisteredError);
      expect(result.value.message).toBe(
        "Point name already registered in this project",
      );
    }
  });

  it("should not be able to create a point with a non-existing utility pole", async () => {
    const project = makeProject();
    inMemoryProjectsRepository.createMany([project]);

    const result = await sut.execute({
      name: "Point 1",
      projectId: project.id.toString(),
      utilityPoleId: "non-existing-pole",
    });

    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);

      expect(result.value.message).toBe("Utility pole does not exist");
    }
  });

  it("should not be able to create a point with a non-existing cable", async () => {
    const project = makeProject();
    inMemoryProjectsRepository.createMany([project]);

    const result = await sut.execute({
      name: "Point 1",
      projectId: project.id.toString(),
      lowTensionEntranceCableId: "non-existing-cable",
      mediumTensionExitCableId: "non-existing-cable-2",
    });

    expect(result.isLeft()).toBeTruthy();
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    if (result.isLeft())
      expect(result.value.message).toBe(
        "Cables not found: non-existing-cable, non-existing-cable-2",
      );
  });
});
