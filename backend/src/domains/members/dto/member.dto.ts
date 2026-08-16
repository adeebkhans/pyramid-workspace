import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

import { PaginationQuery } from '@pyramid/shared/http/pagination.query';
import { MEMBERSHIP_ORIGINS, type MembershipOrigin } from '../member.schema';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class EnrolMemberDto {
  @ApiProperty({ example: 'Priya Raman' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(trim)
  name: string;

  @ApiProperty({ example: 'priya@example.com' })
  @IsEmail()
  @Transform(trim)
  email: string;

  @ApiPropertyOptional({ description: 'Omit to receive a generated portrait derived from the email' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Product Designer' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(trim)
  jobTitle?: string;

  @ApiPropertyOptional({ enum: MEMBERSHIP_ORIGINS, default: 'federated' })
  @IsOptional()
  @IsIn([...MEMBERSHIP_ORIGINS])
  origin?: MembershipOrigin;
}

/**
 * Sent by the Next.js auth callback after a successful Google sign-in. The API
 * treats email as the identity key and reconciles the rest.
 */
export class SyncFederatedMemberDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(trim)
  name: string;

  @ApiProperty()
  @IsEmail()
  @Transform(trim)
  email: string;

  @ApiPropertyOptional({ description: 'Provider-supplied picture; a generated portrait is used when absent' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;
}

export class UpdateMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(trim)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(trim)
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'One word — shown as the member handle' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trim)
  handle?: string;

  @ApiPropertyOptional({ description: 'Pass to regenerate the portrait from a new seed' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  avatarSeed?: string;
}

export class MemberQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: MEMBERSHIP_ORIGINS })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsIn([...MEMBERSHIP_ORIGINS])
  origin?: MembershipOrigin;
}
