import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupEntity } from "../entities/group.entity";
import { GroupMemberEntity } from "../entities/group-member.entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { AddMemberDto, CreateGroupDto } from "../dtos/group.dto";
import { nanoid } from "nanoid";

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly memberRepo: Repository<GroupMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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

    return group;
  }

  async findAll(userId: string) {
    return this.groupRepo.find({
      where: { members: { user: { id: userId } } },
      relations: ["members", "members.user"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string) {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ["members", "members.user"],
    });

    if (!group) {
      throw new NotFoundException("Group not found");
    }

    const isMember = group.members.some((m) => m.user.id === userId);
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

    return this.memberRepo.save({
      group,
      user: userToAdd,
    });
  }

  async joinByCode(userId: string, code: string) {
    const group = await this.groupRepo.findOne({ where: { code } });
    if (!group) {
      throw new NotFoundException("Invalid group code");
    }

    const existingMember = await this.memberRepo.findOne({
      where: { group: { id: group.id }, user: { id: userId } },
    });

    if (existingMember) {
      return group; // Already joined
    }

    await this.memberRepo.save({
      group,
      user: { id: userId },
    });

    return group;
  }
}
