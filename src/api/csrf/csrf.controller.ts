import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { Guest } from '../../common/decorators/guest.decorator';
import { CsrfService } from '../../common/services/csrf.service';

@ApiTags('Security')
@ApiSecurity('api-secret')
@Controller()
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  /**
   * Generates a fresh CSRF token and sends it in response payload/cookie.
   */
  @Guest()
  @Get('csrf-token')
  @ApiOperation({ summary: 'Get CSRF token' })
  getToken(@Req() req: Request, @Res() res: Response) {
    const csrfToken = this.csrfService.generateCsrfToken(req, res, true);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Operation successful',
      data: { csrfToken },
    });
  }
}
