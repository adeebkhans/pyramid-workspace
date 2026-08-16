import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { MemberRepository } from './member.repository';
import { MemberSchema } from './member.schema';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: MODEL.member, schema: MemberSchema }])],
  controllers: [MembersController],
  providers: [MemberRepository, MembersService],
  exports: [MembersService, MemberRepository],
})
export class MembersModule {}
