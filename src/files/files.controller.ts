import { Controller, Get } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('api')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('files')
  async getFiles() {
    return this.filesService.getTransformedData();
  }
}
