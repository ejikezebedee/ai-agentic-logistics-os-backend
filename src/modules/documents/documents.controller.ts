import { Body, Controller, Get, Query, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { RoleCode } from '../../common/domain.enums';
import { DocumentStorageService, ObjectReferencePurpose } from './document-storage.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly storage: DocumentStorageService) {}

  @Post('upload-reference')
  @Roles(RoleCode.WAREHOUSE_STAFF, RoleCode.DRIVER, RoleCode.SUPPORT_AGENT, RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  createReference(@Body() body: {
    ownerType: string;
    ownerId: string;
    purpose: ObjectReferencePurpose;
    objectKey: string;
    contentType: string;
    checksum?: string;
  }) {
    return this.storage.createReference(body);
  }

  @Get()
  @Roles(RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  list(@Query('ownerType') ownerType?: string, @Query('ownerId') ownerId?: string) {
    return this.storage.list(ownerType, ownerId);
  }
}
