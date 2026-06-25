import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh.jwt.token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
