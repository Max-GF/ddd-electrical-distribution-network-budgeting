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
  async save(group: Group): Promise<void> {
    const groupToSaveIndex = this.items.findIndex(
      (item) => item.id.toString() === group.id.toString(),
    );
    if (groupToSaveIndex >= 0) {
      this.items[groupToSaveIndex] = group;
    }
  }
  async findById(id: string): Promise<Group | null> {
    const foundGroup = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    return foundGroup ?? null;
  }
  async findByName(name: string): Promise<Group | null> {
    const foundGroup = this.items.find((item) => item.name === name);
    return foundGroup ?? null;
  }
  async findByNames(names: string[]): Promise<Group[]> {
    return this.items.filter((item) => names.includes(item.name));
  }
}
