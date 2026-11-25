import { UserResponseDto } from '../dto/response/user.res.dto';
import { UserEntity } from '../entity/user.entity';

export function toUserResponse(user: UserEntity): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}
