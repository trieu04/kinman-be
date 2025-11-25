import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";

export enum WalletType {
  CASH = "cash",
  CARD = "card",
  E_WALLET = "e_wallet",
}

@Entity()
export class WalletEntity extends SoftDeleteEntity {
  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: WalletType,
    default: WalletType.CASH,
  })
  type: WalletType;

  @Column("decimal", { precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ default: "VND" })
  currency: string;

  @ManyToOne(() => UserEntity)
  user: UserEntity;
}
