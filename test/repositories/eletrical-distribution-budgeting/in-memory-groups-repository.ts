import { GroupsRepository } from "src/domain/eletrical-distribution-budgeting/application/repositories/groups-repository";
import { Group } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/group";
import { GroupItem } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/group-item";
import { InMemoryGroupItemsRepository } from "./in-memory-group-items-repository";

export class InMemoryGroupsRepository implements GroupsRepository {
  public items: Group[] = [];
  constructor(private groupItemsRepository: InMemoryGroupItemsRepository) {}

  async createMany(groups: Group[]): Promise<void> {
    this.items.push(...groups);
  }
  async createGroupWithItems(group: Group, items: GroupItem[]): Promise<void> {
    this.items.push(group);
    await this.groupItemsRepository.createMany(items);
  }
  async updateGroupAndItems(
    group: Group,
    itemsToCreate: GroupItem[],
    itemsToEdit: GroupItem[],
  ): Promise<void> {
    const groupIndex = this.items.findIndex((item) => item.id === group.id);

    if (groupIndex >= 0) {
      this.items[groupIndex] = group;
      await this.groupItemsRepository.createMany(itemsToCreate);
      await this.groupItemsRepository.updateMany(itemsToEdit);
    }
  }
  async findById(id: string): Promise<Group | null> {
    const foundedGroup = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    return foundedGroup ?? null;
  }
  async findByName(name: string): Promise<Group | null> {
    const foundedGroup = this.items.find((item) => item.name === name);
    return foundedGroup ?? null;
  }
  async findByNames(names: string[]): Promise<Group[]> {
    return this.items.filter((item) => names.includes(item.name));
  }
  async createBulkGroupsWithItems(
    groupsWithItems: { group: Group; items: GroupItem[] }[],
  ): Promise<void> {
    const { groups, items } = groupsWithItems.reduce(
      (acc, groupWithItems) => {
        acc.groups.push(groupWithItems.group);
        acc.items.push(...groupWithItems.items);
        return acc;
      },
      { groups: [] as Group[], items: [] as GroupItem[] },
    );
    this.items.push(...groups);
    await this.groupItemsRepository.createMany(items);
  }
}
