import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { GroupExpenseEntity } from '../finance/entities/group-expense.entity';
import { SettlementEntity } from '../finance/entities/settlement.entity';
import { GroupEntity } from '../finance/entities/group.entity';
import { CategoryEntity } from '../finance/entities/category.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TransactionEntity,
            GroupExpenseEntity,
            SettlementEntity,
            GroupEntity,
            CategoryEntity,
            UserEntity,
        ]),
        forwardRef(() => AuthModule), // Use forwardRef to avoid circular dependency
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }
