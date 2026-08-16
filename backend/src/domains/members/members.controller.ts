import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ObjectIdPipe } from '@pyramid/shared/http/object-id.pipe';
import { EnrolMemberDto, MemberQuery, SyncFederatedMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MemberView } from './member.presenter';
import { MembersService } from './members.service';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List workspace members' })
  list(@Query() query: MemberQuery) {
    return this.members.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Enrol a member; returns the existing record when the email is already known' })
  @ApiOkResponse({ type: MemberView })
  enrol(@Body() payload: EnrolMemberDto) {
    return this.members.enrol(payload);
  }

  /**
   * Declared before `:id` so Express does not try to parse "guest-session" as
   * an object id.
   */
  @Post('guest-session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mint a fresh guest member with its own generated avatar' })
  @ApiOkResponse({ type: MemberView })
  openGuestSession() {
    return this.members.openGuestSession();
  }

  @Post('federated-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert the member behind an OAuth identity' })
  @ApiOkResponse({ type: MemberView })
  syncFederated(@Body() payload: SyncFederatedMemberDto) {
    return this.members.syncFederated(payload);
  }

  @Get('by-email/:email')
  @ApiOperation({ summary: 'Look a member up by email address' })
  lookupByEmail(@Param('email') email: string) {
    return this.members.getByEmail(decodeURIComponent(email));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single member' })
  @ApiOkResponse({ type: MemberView })
  getOne(@Param('id', ObjectIdPipe) id: string) {
    return this.members.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the editable parts of a member profile' })
  @ApiOkResponse({ type: MemberView })
  update(@Param('id', ObjectIdPipe) id: string, @Body() changes: UpdateMemberDto) {
    return this.members.update(id, changes);
  }
}
