import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { ApplyRulesDto, CreateRuleDto, UpdateRuleDto } from './dto/rule.dto'
import { RulesService } from './rules.service'

@ApiTags('rules')
@ApiBearerAuth()
@Controller('rules')
export class RulesController {
  constructor(private readonly rules: RulesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.rules.list(user.id)
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRuleDto) {
    return this.rules.create(user.id, dto)
  }

  @Post('apply')
  @HttpCode(200)
  async apply(@CurrentUser() user: AuthUser, @Body() dto: ApplyRulesDto) {
    return { updated: await this.rules.apply(user.id, dto.overwrite ?? true) }
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRuleDto) {
    return this.rules.update(user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.rules.remove(user.id, id)
  }
}
