import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
    constructor(private gateway: RealtimeGateway) { }

    notifyExpenseAdded(groupId: string, expense: any) {
        this.gateway.broadcastExpenseAdded(groupId, expense);
    }

    notifyExpenseUpdated(groupId: string, expense: any) {
        this.gateway.broadcastExpenseUpdated(groupId, expense);
    }

    notifyExpenseDeleted(groupId: string, expenseId: string, groupId_: string) {
        this.gateway.broadcastExpenseDeleted(groupId, { id: expenseId });
    }

    notifyGroupUpdated(groupId: string, group: any) {
        this.gateway.broadcastGroupUpdated(groupId, group);
    }

    notifyDebtSettled(groupId: string, settlement: any) {
        this.gateway.broadcastDebtSettled(groupId, settlement);
    }

    subscribeUserToGroup(userId: string, groupId: string) {
        this.gateway.subscribeToGroup(userId, groupId);
    }

    unsubscribeUserFromGroup(userId: string, groupId: string) {
        this.gateway.unsubscribeFromGroup(userId, groupId);
    }
}
