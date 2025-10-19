import { GroupItem } from "../../enterprise/entities/group-item";
import { TensionLevelEntries } from "../../enterprise/entities/value-objects/tension-level";

export interface FetchGroupItemsFilterOptions {
  codes?: number[];
  description?: string;
  tension?: TensionLevelEntries;
}

export abstract class GroupItemsRepository {
  abstract createMany(groupitems: GroupItem[]): Promise<void>;
  abstract findById(id: string): Promise<GroupItem | null>;
  abstract findByGroupId(groupId: string): Promise<GroupItem[]>;
}
