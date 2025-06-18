import { Injectable } from "@nestjs/common";
import { Either, left, right } from "src/core/either";
import { AlreadyRegisteredError } from "src/core/errors/generics/already-registered-error";
import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
import { ResourceNotFoundError } from "src/core/errors/generics/resource-not-found-error";
import { Material } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/material";
import { MaterialsRepository } from "../../repositories/materials-repository";

interface EditMaterialUseCaseRequest {
  materialId: string;
  description?: string;
  unit?: string;
}

type EditMaterialUseCaseResponse = Either<
  AlreadyRegisteredError | ResourceNotFoundError | NotAllowedError,
  {
    material: Material;
  }
>;

@Injectable()
export class EditMaterialUseCase {
  constructor(private materialsRepository: MaterialsRepository) {}

  async execute(
    editMaterialUseCaseRequest: EditMaterialUseCaseRequest,
  ): Promise<EditMaterialUseCaseResponse> {
    let hasToEdit = false;

    if (this.noEntries(editMaterialUseCaseRequest)) {
      return left(new NotAllowedError("No entries provided"));
    }

    const { materialId, description, unit } = editMaterialUseCaseRequest;

    const materialToEdit = await this.materialsRepository.findById(materialId);

    if (!materialToEdit) {
      return left(new ResourceNotFoundError("Given material was not found"));
    }

    if (
      description &&
      description.toUpperCase() !== materialToEdit.description
    ) {
      materialToEdit.description = description.toUpperCase();
      hasToEdit = true;
    }
    if (unit && unit.toUpperCase() !== materialToEdit.unit) {
      materialToEdit.unit = unit.toUpperCase();
      hasToEdit = true;
    }

    if (hasToEdit) {
      await this.materialsRepository.save(materialToEdit);
    }
    return right({
      material: materialToEdit,
    });
  }

  noEntries(editMaterialUseCaseRequest: EditMaterialUseCaseRequest): boolean {
    return Object.entries(editMaterialUseCaseRequest)
      .filter(([key]) => key !== "materialId")
      .every(([, value]) => value === undefined);
  }
}
