import {
  PaginationParams,
  PaginationResponseParams,
} from "src/core/repositories/pagination-params";
import { Group } from "../../enterprise/entities/group";
import { GroupItem } from "../../enterprise/entities/group-item";
import { TensionLevelEntries } from "../../enterprise/entities/value-objects/tension-level";

export interface FetchGroupsFilterOptions {
  codes?: number[];
  description?: string;
  tension?: TensionLevelEntries;
}

export abstract class GroupsRepository {
  abstract createMany(groups: Group[]): Promise<void>;
  abstract createGroupWithItems(
    group: Group,
    items: GroupItem[],
  ): Promise<void>;
  abstract save(group: Group): Promise<void>;
  abstract findById(id: string): Promise<Group | null>;
  abstract findByName(name: string): Promise<Group | null>;
  abstract findByNames(names: string[]): Promise<Group[]>;
  abstract fetchWithFilter(
    filterOptions: FetchGroupsFilterOptions,
    paginationParams: PaginationParams,
  ): Promise<{
    groups: Group[];
    pagination: PaginationResponseParams;
  }>;
}
