import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";

export enum CategoryType {
  INCOME = "income",
  EXPENSE = "expense",
}

@Entity()
export class CategoryEntity extends SoftDeleteEntity {
  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: CategoryType,
    default: CategoryType.EXPENSE,
  })
  type: CategoryType;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  user: UserEntity;
}
