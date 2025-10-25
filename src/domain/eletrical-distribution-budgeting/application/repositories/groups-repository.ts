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
  abstract findById(id: string): Promise<Group | null>;
  abstract findByName(name: string): Promise<Group | null>;
  abstract createGroupWithItems(
    group: Group,
    items: GroupItem[],
  ): Promise<void>;
  abstract updateGroupAndItems(
    group: Group,
    itemsToCreate: GroupItem[],
    itemsToEdit: GroupItem[],
  ): Promise<void>;
}
