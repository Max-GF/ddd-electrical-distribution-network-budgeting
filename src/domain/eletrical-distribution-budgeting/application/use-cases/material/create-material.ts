import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { Material } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/material";
import { MaterialsRepository } from "../../repositories/materials-repository";

export interface CreateMaterialUseCaseRequest {
  code: number;
  description: string;
  unit: string;
}

type CreateMaterialUseCaseResponse = Either<
  AlreadyRegisteredError,
  {
    material: Material;
  }
>;

@Injectable()
export class CreateMaterialUseCase {
  constructor(private materialsRepository: MaterialsRepository) {}

  async execute({
    code,
    description,
    unit,
  }: CreateMaterialUseCaseRequest): Promise<CreateMaterialUseCaseResponse> {
    const materialWithSameCode =
      await this.materialsRepository.findByCode(code);
    if (materialWithSameCode) {
      return left(
        new AlreadyRegisteredError("Material code already registered"),
      );
    }

    const material = Material.create({
      code,
      description: description.toUpperCase(),
      unit: unit.toUpperCase(),
    });
    await this.materialsRepository.createMany([material]);
    return right({
      material,
    });
  }
}
