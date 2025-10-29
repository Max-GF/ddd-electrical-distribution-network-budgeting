import { GroupItemsRepository } from "src/domain/eletrical-distribution-budgeting/application/repositories/group-items-repository";
import { GroupItem } from "src/domain/eletrical-distribution-budgeting/enterprise/entities/group-item";

export class InMemoryGroupItemsRepository implements GroupItemsRepository {
  public items: GroupItem[] = [];
  async createMany(groupitems: GroupItem[]): Promise<void> {
    this.items.push(...groupitems);
  }
  async updateMany(groupitems: GroupItem[]): Promise<void> {
    groupitems.forEach((groupitem) => {
      const index = this.items.findIndex(
        (item) => item.id.toString() === groupitem.id.toString(),
      );
      if (index >= 0) {
        this.items[index] = groupitem;
      }
    });
  }
  async findById(id: string): Promise<GroupItem | null> {
    const foundGroupItem = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    return foundGroupItem ?? null;
  }
  async findByGroupId(groupId: string): Promise<GroupItem[]> {
    return this.items.filter(
      (item) => item.groupId.toString() === groupId.toString(),
    );
  }
}
