import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { rethrowServiceError } from '../../../common/http/service-error';
import { UserResponseDto } from '../dto/response/user.res.dto';
import { UserEntity } from '../entity/user.entity';
import { normalizeEmail } from '../helpers/email.helper';
import { toUserResponse } from '../mapper/user.mapper';
import { UserRepository } from '../repository/user.repository';
import type { SuperTokensAccount } from '../types/supertokens-account';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly users: UserRepository,
  ) {}

  async findByAuthUserId(authUserId: string): Promise<UserEntity | null> {
    return this.users.findByAuthUserId(authUserId);
  }

  async requireByAuthUserId(authUserId: string): Promise<UserEntity> {
    try {
      const user = await this.users.findByAuthUserId(authUserId);
      if (!user) {
        // 403 — not 401. SuperTokens treats every 401 as "refresh the session",
        // which clears a still-valid login when the Sofa user row is missing.
        throw new HttpException(
          'No account exists for this login. Sign up first',
          HttpStatus.FORBIDDEN,
        );
      }
      if (!user.isActive) {
        throw new HttpException(
          'Your account is disabled',
          HttpStatus.FORBIDDEN,
        );
      }
      user.lastLoginAt = new Date();
      return await this.users.save(user);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `UsersService.requireByAuthUserId authUserId=${authUserId}`,
        'Could not load your account',
      );
    }
  }

  /**
   * Creates the app user after SuperTokens signup.
   * Password credentials live only in SuperTokens Core.
   */
  async createFromSuperTokens(
    account: SuperTokensAccount,
  ): Promise<UserEntity> {
    const emailNormalized = normalizeEmail(account.email);
    await this.assertEmailAvailable(emailNormalized);

    return this.dataSource.transaction(async (manager) => {
      const users = new UserRepository(this.dataSource, manager);
      return users.save(
        users.create({
          authUserId: account.authUserId,
          email: account.email.trim(),
          emailNormalized,
          displayName: `${account.firstName} ${account.lastName}`.trim(),
          avatarUrl: account.avatarUrl?.trim() || null,
          isActive: true,
          lastLoginAt: null,
        }),
      );
    });
  }

  async isEmailRegistered(email: string): Promise<boolean> {
    const user = await this.users.findByEmailNormalized(normalizeEmail(email));
    return user !== null;
  }

  /** Fills a missing profile photo (e.g. Google `picture`) without overwriting a custom avatar. */
  async setAvatarUrlIfEmpty(
    authUserId: string,
    avatarUrl: string,
  ): Promise<void> {
    const user = await this.users.findByAuthUserId(authUserId);
    if (!user || user.avatarUrl) {
      return;
    }
    user.avatarUrl = avatarUrl;
    await this.users.save(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    try {
      return await this.users.findById(id);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `UsersService.findById id=${id}`,
        'Could not load the user',
      );
    }
  }

  /** Display details for user ids shown in other modules' responses. */
  async findSummaries(ids: string[]): Promise<Map<string, UserResponseDto>> {
    const unique = [...new Set(ids)];
    const rows = await this.users.findByIds(unique);
    return new Map(rows.map((row) => [row.id, toUserResponse(row)]));
  }

  private async assertEmailAvailable(emailNormalized: string): Promise<void> {
    const existing = await this.users.findByEmailNormalized(emailNormalized);
    if (existing) {
      throw new HttpException(
        'An account with this email already exists',
        HttpStatus.CONFLICT,
      );
    }
  }
}
