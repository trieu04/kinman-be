import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupEntity } from "../entities/group.entity";
import { GroupMemberEntity } from "../entities/group-member.entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { AddMemberDto, CreateGroupDto } from "../dtos/group.dto";
import { nanoid } from "nanoid";
import { NotificationDispatcherService } from "../../notification/services/notification-dispatcher.service";
import { NotificationType } from "../../notification/entities/notification.entity";
import { RealtimeService } from "../../realtime/realtime.service";

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly memberRepo: Repository<GroupMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly notificationDispatcher: NotificationDispatcherService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async create(userId: string, dto: CreateGroupDto) {
    const code = nanoid(6).toUpperCase();
    const group = this.groupRepo.create({
      ...dto,
      code,
      creator: { id: userId },
    });
    await this.groupRepo.save(group);

    // Add creator as member
    await this.memberRepo.save({
      group,
      user: { id: userId },
    });

    // Return group with members loaded
    return this.groupRepo.findOne({
      where: { id: group.id },
      relations: ["members", "members.user"],
    });
  }

  async findAll(userId: string) {
    // Dùng query builder để không bị filter mất các member khác khi join với điều kiện userId
    return this.groupRepo
      .createQueryBuilder("group")
      .leftJoinAndSelect("group.members", "members")
      .leftJoinAndSelect("members.user", "memberUser")
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select("1")
          .from("group_member_entity", "gm")
          .where("gm.group_id = group.id")
          .andWhere("gm.user_id = :userId")
          .getQuery();
        return `EXISTS (${subQuery})`;
      })
      .setParameter("userId", userId)
      .orderBy("group.createdAt", "DESC")
      .getMany();
  }

  async findOne(id: string, userId: string) {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ["members", "members.user"],
    });

    if (!group) {
      throw new NotFoundException("Group not found");
    }

    const isMember = group.members.some(m => m.user.id === userId);
    if (!isMember) {
      throw new NotFoundException("Group not found or you are not a member");
    }

    return group;
  }

  async addMember(userId: string, groupId: string, dto: AddMemberDto) {
    const group = await this.findOne(groupId, userId); // Ensure requester is member

    const userToAdd = await this.userRepo.findOne({
      where: [
        { username: dto.usernameOrEmail },
        { email: dto.usernameOrEmail },
      ],
    });

    if (!userToAdd) {
      throw new NotFoundException("User not found");
    }

    const existingMember = await this.memberRepo.findOne({
      where: { group: { id: groupId }, user: { id: userToAdd.id } },
    });

    if (existingMember) {
      throw new BadRequestException("User is already a member");
    }

    const member = await this.memberRepo.save({
      group,
      user: userToAdd,
    });

    // Notify other group members about new member
    const otherMembers = group.members.filter(m => m.user.id !== userToAdd.id);
    for (const m of otherMembers) {
      await this.notificationDispatcher.dispatch({
        userId: m.user.id,
        email: m.user.email,
        type: NotificationType.GROUP_JOIN,
        title: `${userToAdd.name || userToAdd.email} đã tham gia nhóm`,
        body: `${userToAdd.name || userToAdd.email} vừa được thêm vào nhóm "${group.name}".`,
        data: { groupId: group.id, groupName: group.name },
      });
    }

    // Broadcast realtime event
    this.realtimeService.notifyGroupUpdated(groupId, {
      id: group.id,
      name: group.name,
      memberAdded: {
        id: userToAdd.id,
        name: userToAdd.name,
        email: userToAdd.email,
      },
    });

    return member;
  }

  async joinByCode(userId: string, code: string) {
    const group = await this.groupRepo.findOne({
      where: { code },
      relations: ["members", "members.user"],
    });
    if (!group) {
      throw new NotFoundException("Invalid group code");
    }

    const existingMember = await this.memberRepo.findOne({
      where: { group: { id: group.id }, user: { id: userId } },
    });

    if (existingMember) {
      return group; // Already joined
    }

    const joiningUser = await this.userRepo.findOne({ where: { id: userId } });

    await this.memberRepo.save({
      group,
      user: { id: userId },
    });

    // Notify other group members about new member joining
    if (joiningUser) {
      for (const m of group.members) {
        await this.notificationDispatcher.dispatch({
          userId: m.user.id,
          email: m.user.email,
          type: NotificationType.GROUP_JOIN,
          title: `${joiningUser.name || joiningUser.email} đã tham gia nhóm`,
          body: `${joiningUser.name || joiningUser.email} vừa tham gia nhóm "${group.name}" bằng mã mời.`,
          data: { groupId: group.id, groupName: group.name },
        });
      }
    }

    // Broadcast realtime event
    this.realtimeService.notifyGroupUpdated(group.id, {
      id: group.id,
      name: group.name,
      memberJoined: {
        id: userId,
        name: joiningUser?.name,
        email: joiningUser?.email,
      },
    });

    return group;
  }

  async toggleHidden(userId: string, groupId: string) {
    const member = await this.memberRepo.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });

    if (!member) {
      throw new NotFoundException("Group not found or you are not a member");
    }

    member.isHidden = !member.isHidden;
    await this.memberRepo.save(member);
  }
}
