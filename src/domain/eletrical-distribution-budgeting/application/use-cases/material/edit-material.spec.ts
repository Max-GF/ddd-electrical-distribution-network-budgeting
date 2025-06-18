import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { makeMaterial } from "test/factories/eletrical-distribution-budgeting/make-material";
import { InMemoryMaterialsRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-materials-repository";
import { EditMaterialUseCase } from "./edit-material";

let inMemoryMaterialsRepository: InMemoryMaterialsRepository;
let sut: EditMaterialUseCase;

describe("Edit Material", () => {
  beforeEach(() => {
    inMemoryMaterialsRepository = new InMemoryMaterialsRepository();
    sut = new EditMaterialUseCase(inMemoryMaterialsRepository);
  });

  it("should be able to edit a material", async () => {
    const materialToEdit = makeMaterial({
      code: 123456,
      description: "3000mm Material",
      unit: "MM",
    });
    await inMemoryMaterialsRepository.createMany([materialToEdit]);
    expect(inMemoryMaterialsRepository.items).toHaveLength(1);
    const result = await sut.execute({
      materialId: materialToEdit.id.toString(),
      description: "4000mm Material",
      unit: "UND",
    });

    expect(inMemoryMaterialsRepository.items).toHaveLength(1);
    expect(result.isRight()).toBeTruthy();
    if (result.isRight()) {
      expect(inMemoryMaterialsRepository.items[0]).toEqual(
        result.value.material,
      );
      expect(inMemoryMaterialsRepository.items[0].description).toBe(
        "4000MM MATERIAL",
      );
      expect(inMemoryMaterialsRepository.items[0].unit).toBe("UND");
    }
  });

  it("should not be able to edit unexisting material", async () => {
    const result = await sut.execute({
      materialId: "unexisting-id",
      description: "4000mm Material",
    });

    expect(inMemoryMaterialsRepository.items).toHaveLength(0);
    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toBe("Given material was not found");
    }
  });
  it("should not be able to edit a material when no entries was given", async () => {
    const materialToEdit = makeMaterial({
      code: 123456,
      description: "3000mm Material",
    });
    await inMemoryMaterialsRepository.createMany([materialToEdit]);
    expect(inMemoryMaterialsRepository.items).toHaveLength(1);
    const result = await sut.execute({
      materialId: materialToEdit.id.toString(),
    });

    expect(inMemoryMaterialsRepository.items).toHaveLength(1);
    expect(result.isLeft()).toBeTruthy();
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError);
      expect(result.value.message).toBe("No entries provided");
    }
  });
});
