import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class PostCommentDto {
  @ApiProperty({ example: 'Reviewed — ready to merge.' })
  @IsString()
  @MinLength(1)
  @MaxLength(4_000)
  @Transform(trim)
  body: string;

  @ApiProperty({ description: 'Task the comment belongs to' })
  @IsMongoId()
  taskId: string;

  @ApiProperty({ description: 'Member posting the comment' })
  @IsMongoId()
  authorId: string;

  @ApiPropertyOptional({ description: 'Set to reply to an existing comment' })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}

export class EditCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4_000)
  @Transform(trim)
  body: string;
}

export class ThreadQuery {
  @ApiProperty({ description: 'Task whose thread should be returned' })
  @IsMongoId()
  taskId: string;
}
