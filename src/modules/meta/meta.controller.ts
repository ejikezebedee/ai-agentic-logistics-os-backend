import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth.decorators';
import { API_BREAKING_CHANGE_POLICY, API_CONTRACT_STATUS, API_VERSION, FRONTEND_CRITICAL_ENDPOINTS } from '../../common/api-version';

@ApiTags('meta')
@Controller('meta')
export class MetaController {
  @Public()
  @Get('version')
  version() {
    return {
      apiVersion: API_VERSION,
      contractStatus: API_CONTRACT_STATUS,
      generatedFor: 'Codey/frontend integration'
    };
  }

  @Public()
  @Get('contract')
  contract() {
    return {
      apiVersion: API_VERSION,
      contractStatus: API_CONTRACT_STATUS,
      breakingChangePolicy: API_BREAKING_CHANGE_POLICY,
      frontendCriticalEndpoints: FRONTEND_CRITICAL_ENDPOINTS,
      openApiPath: 'docs/openapi/openapi.json'
    };
  }
}
