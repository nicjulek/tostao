import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { FILE_BODY, ImportFileDto, PreviewFileDto } from './dto/import.dto'
import { ImportsService, MAX_FILE_SIZE, UploadedStatement } from './imports.service'

const upload = FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE + 1, files: 1 } })

@ApiTags('imports')
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @ApiBearerAuth()
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.imports.list(user.id)
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY)
  @Post('preview')
  @UseInterceptors(upload)
  preview(@CurrentUser() user: AuthUser, @UploadedFile() file: UploadedStatement | undefined, @Body() dto: PreviewFileDto) {
    return this.imports.preview(user.id, file, dto.accountId)
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  @UseInterceptors(upload)
  start(@CurrentUser() user: AuthUser, @UploadedFile() file: UploadedStatement | undefined, @Body() dto: ImportFileDto) {
    return this.imports.start(user.id, dto.accountId, file)
  }

  @ApiBearerAuth()
  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.imports.get(user.id, id)
  }

  @ApiBearerAuth()
  @Delete(':id')
  undo(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.imports.undo(user.id, id)
  }
}
