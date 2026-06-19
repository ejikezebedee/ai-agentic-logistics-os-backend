import { BadRequestException, Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { DeliveryProofDto, PickupProofDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { RequestActor } from '../../common/auth.decorators';
import { OperationsService } from '../shipments/operations.service';
import { LocationService } from '../tracking/location.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('drivers')
@Controller('driver')
@Roles(RoleCode.DRIVER, RoleCode.SUPER_ADMIN)
export class DriverController {
  constructor(
    private readonly operations: OperationsService,
    private readonly locations: LocationService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  @Get('jobs')
  async jobs(@Actor() actor: RequestActor) {
    if (this.hasPrisma()) {
      return { jobs: await (this.prisma as any).dispatchAssignment.findMany({ where: { driverId: actor.id }, include: { shipment: true, vehicle: true } }) };
    }
    return { jobs: [] };
  }

  @Post('jobs/:id/accept')
  async accept(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).dispatchAssignment.update({ where: { id }, data: { status: 'accepted' } }).catch((error: unknown) => this.assignmentError(id, error));
    return { jobId: id, status: 'accepted' };
  }

  @Post('jobs/:id/reject')
  async reject(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).dispatchAssignment.update({ where: { id }, data: { status: 'rejected' } }).catch((error: unknown) => this.assignmentError(id, error));
    return { jobId: id, status: 'rejected' };
  }

  @Post('pickup/:shipmentId/complete')
  @ApiBody({ type: PickupProofDto })
  pickup(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: PickupProofDto) {
    return this.operations.completePickup(actor.id, shipmentId, this.normalizedPickup(dto));
  }

  @Post('delivery/:shipmentId/attempt')
  attempt(@Param('shipmentId') shipmentId: string, @Body() body: Record<string, unknown>) {
    return { shipmentId, status: 'delivery_attempted', ...body };
  }

  @Post('delivery/:shipmentId/complete')
  @ApiBody({ type: DeliveryProofDto })
  complete(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: DeliveryProofDto) {
    return this.operations.completeDelivery(actor.id, shipmentId, dto.tier, this.normalizedProof(dto));
  }

  @Post('location')
  location(@Body() body: Record<string, unknown>) {
    return this.locations.checkIn(body as { driverId: string; latitude: number; longitude: number; accuracyMeters?: number; shipmentId?: string });
  }

  @Get('earnings')
  earnings() {
    return { currency: 'EUR', pending: 0, paid: 0 };
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).dispatchAssignment?.findMany === 'function');
  }

  private normalizedProof(dto: DeliveryProofDto): DeliveryProofDto {
    dto.gps = dto.gps ?? dto.location ?? ({ latitude: dto.latitude, longitude: dto.longitude } as any);
    if (dto.gps && (dto.gps.latitude === undefined || dto.gps.longitude === undefined)) {
      dto.gps.latitude = dto.gps.latitude ?? dto.gps.lat;
      dto.gps.longitude = dto.gps.longitude ?? dto.gps.lng;
    }
    dto.packageScanCode = dto.packageScanCode ?? dto.barcode ?? dto.scanCode;
    dto.photoObjectKey = dto.photoObjectKey ?? dto.photoUrl;
    dto.signatureObjectKey = dto.signatureObjectKey ?? dto.signatureUrl;
    if (dto.gps && (dto.gps.latitude === undefined || dto.gps.longitude === undefined)) {
      throw new BadRequestException({
        message: 'Delivery GPS requires latitude/longitude or lat/lng.',
        error: 'ContractMismatch'
      });
    }
    return dto;
  }

  private normalizedPickup(dto: PickupProofDto): PickupProofDto {
    dto.packageScanCode = dto.packageScanCode ?? dto.barcode ?? dto.scanCode;
    dto.photoObjectKey = dto.photoObjectKey ?? dto.photoUrl;
    return dto;
  }

  private assignmentError(id: string, error: unknown): never {
    throw new BadRequestException({
      message: 'Driver job could not be updated for the supplied assignment id.',
      error: 'ContractMismatch',
      details: { id, cause: error instanceof Error ? error.message : String(error) }
    });
  }
}

@ApiTags('drivers')
@Controller('drivers')
@Roles(RoleCode.DRIVER, RoleCode.SUPER_ADMIN)
export class DriversController {
  constructor(private readonly operations: OperationsService) {}

  @Post('pickup/:shipmentId/complete')
  @ApiBody({ type: PickupProofDto })
  pickup(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: PickupProofDto) {
    dto.packageScanCode = dto.packageScanCode ?? dto.barcode ?? dto.scanCode;
    dto.photoObjectKey = dto.photoObjectKey ?? dto.photoUrl;
    return this.operations.completePickup(actor.id, shipmentId, dto);
  }

  @Post('delivery/:shipmentId/complete')
  @ApiBody({ type: DeliveryProofDto })
  complete(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: DeliveryProofDto) {
    dto.gps = dto.gps ?? dto.location ?? ({ latitude: dto.latitude, longitude: dto.longitude } as any);
    if (dto.gps && (dto.gps.latitude === undefined || dto.gps.longitude === undefined)) {
      dto.gps.latitude = dto.gps.latitude ?? dto.gps.lat;
      dto.gps.longitude = dto.gps.longitude ?? dto.gps.lng;
    }
    dto.packageScanCode = dto.packageScanCode ?? dto.barcode ?? dto.scanCode;
    dto.photoObjectKey = dto.photoObjectKey ?? dto.photoUrl;
    dto.signatureObjectKey = dto.signatureObjectKey ?? dto.signatureUrl;
    if (dto.gps && (dto.gps.latitude === undefined || dto.gps.longitude === undefined)) {
      throw new BadRequestException({
        message: 'Delivery GPS requires latitude/longitude or lat/lng.',
        error: 'ContractMismatch'
      });
    }
    return this.operations.completeDelivery(actor.id, shipmentId, dto.tier, dto);
  }
}
