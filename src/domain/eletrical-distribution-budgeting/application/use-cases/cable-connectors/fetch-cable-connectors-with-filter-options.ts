// import { Injectable } from "@nestjs/common";
// import { Either, left, right } from "src/core/either";
// import { NotAllowedError } from "src/core/errors/generics/not-allowed-error";
// import { CableConnector } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/cable-connectors";
// import { TensionLevel } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/value-objects/tension-level";
// import { CableConnectorsRepository } from "../../repositories/cable-connectors-repository";

// interface FetchWithFilterCableConnectorUseCaseRequest {
//   codes?: number[];
//   description?: string;

//   entranceMinValueMM?: number;
//   entranceMaxValueMM?: number;

//   exitMinValueMM?: number;
//   exitMaxValueMM?: number;

//   page?: number;
//   perPage?: number;
// }

// type FetchWithFilterCableConnectorUseCaseResponse = Either<
//   NotAllowedError,
//   {
//     cables: CableConnector[];
//   }
// >;

// @Injectable()
// export class FetchWithFilterCableConnectorUseCase {
//   constructor(private cablesRepository: CableConnectorsRepository) {}

//   async execute({
//     codes,
//     description,
//     entranceMinValueMM,
//     entranceMaxValueMM,
//     exitMinValueMM,
//     exitMaxValueMM,
//     page,
//     perPage,
//   }: FetchWithFilterCableConnectorUseCaseRequest): Promise<FetchWithFilterCableConnectorUseCaseResponse> {
//     const upperCasedTension = tension ? tension.toUpperCase() : undefined;
//     if (
//       upperCasedTension !== undefined &&
//       !TensionLevel.isValid(upperCasedTension)
//     ) {
//       return left(
//         new NotAllowedError(
//           `Invalid tension level: ${tension}. Valid values are: ${TensionLevel.VALID_VALUES.join(", ")}.`,
//         ),
//       );
//     }

//     const { cables, pagination } = await this.cablesRepository.fetchWithFilter(
//       {
//         codes,
//         description,
//         tension: upperCasedTension,
//         maxSectionAreaInMM,
//         minSectionAreaInMM,
//       },
//       {
//         page: page ?? 1,
//         perPage: perPage ?? 40,
//       },
//     );
//     return right({
//       cables,
//       pagination,
//     });
//   }
// }
