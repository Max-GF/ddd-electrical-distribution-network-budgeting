import { faker } from "@faker-js/faker";
import { UniqueEntityID } from "src/core/entities/unique-entity-id";
import {
  Material,
  MaterialProps,
} from "src/domain/eletrical-distribution-budgeting/enterprise/entities/material";

export function makeMaterial(
  override: Partial<MaterialProps> = {},
  id?: UniqueEntityID,
) {
  const material = Material.create(
    {
      code: faker.number.int({ min: 1000, max: 9999 }),
      description: faker.lorem.sentence(),
      unit: faker.helpers.arrayElement(["UND", "M", "MM", "KG"]),

      ...override,
    },
    id,
  );

  return material;
}
