import { Material } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/material";
import { makeMaterial } from "test/factories/eletrical-distribution-budgeting/make-material";
import { InMemoryMaterialsRepository } from "test/repositories/eletrical-distribution-budgeting/in-memory-materials-repository";
import { FetchWithFilterMaterialsUseCase } from "./fetch-materials-with-filter-options";

let inMemoryMaterialsRepository: InMemoryMaterialsRepository;
let sut: FetchWithFilterMaterialsUseCase;

describe("Fetch materials with options", () => {
  beforeEach(() => {
    inMemoryMaterialsRepository = new InMemoryMaterialsRepository();
    sut = new FetchWithFilterMaterialsUseCase(inMemoryMaterialsRepository);
  });

  it("should be able to fetch materials with diferent options", async () => {
    const materialsToCreate: Material[] = [];

    for (let i = 0; i < 70; i++) {
      materialsToCreate.push(
        makeMaterial({
          code: 1000 + i,
        }),
      );
      materialsToCreate.push(
        makeMaterial({
          code: 2000 + i,
          description: `MATERIAL ${i}`,
        }),
      );
    }
    await inMemoryMaterialsRepository.createMany(materialsToCreate);
    expect(inMemoryMaterialsRepository.items).toHaveLength(140);
    const result1 = await sut.execute({ codes: [1000, 1001, 1002] });
    const result2 = await sut.execute({ description: "material" });

    expect(result1.isRight()).toBeTruthy();
    if (result1.isRight()) {
      expect(result1.value.materials).toHaveLength(3);
    }
    expect(result2.isRight()).toBeTruthy();
    if (result2.isRight()) {
      expect(result2.value.materials).toHaveLength(40);
      expect(result2.value.pagination.lastPage).toBe(2);
    }
  });
});
