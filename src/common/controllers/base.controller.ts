import { Delete, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

import { QueryDto } from '../dto/query.dto';
import { BaseService } from '../services/base.service';

@ApiBearerAuth()
@ApiSecurity('api-secret')
@ApiSecurity('csrf-token')
export class BaseController<T extends { id: number }> {
  constructor(private readonly service: BaseService<T>) {}

  /**
   * Returns paginated resources using shared query options.
   */
  @Get()
  paginate(@Query() query: QueryDto) {
    return this.service.paginate(query);
  }

  /**
   * Returns a single resource by ID.
   */
  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneById(id);
  }

  /**
   * Deletes a single resource by ID.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
