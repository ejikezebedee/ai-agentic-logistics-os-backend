import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AiRiskLevel, DisputeStatus, PackageStatus, PaymentStatus, ProofTier, RoleCode } from './domain.enums';

export class IdParamDto {
  @ApiProperty()
  @IsString()
  id!: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  merchantId!: string;

  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  items!: Array<Record<string, unknown>>;
}

export class AssignDriverDto {
  @ApiProperty()
  @IsString()
  shipmentId!: string;

  @ApiProperty()
  @IsString()
  driverId!: string;

  @ApiProperty({ enum: PackageStatus })
  @IsEnum(PackageStatus)
  packageStatus!: PackageStatus;
}

export class GpsDto {
  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  withinTolerance?: boolean;
}

export class DeliveryProofDto {
  @ApiProperty({ enum: ProofTier })
  @IsEnum(ProofTier)
  tier!: ProofTier;

  @ApiProperty({ type: GpsDto })
  @ValidateNested()
  @Type(() => GpsDto)
  gps!: GpsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoObjectKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureObjectKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idCheckReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packageScanCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  disponentOverrideApprovalId?: string;
}

export class PickupProofDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packageScanCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoObjectKey?: string;
}

export class EscrowReleaseDto {
  @ApiProperty()
  @IsString()
  accountId!: string;

  @ApiProperty()
  @IsString()
  shipmentId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsBoolean()
  proofAccepted!: boolean;

  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  disputeStatus!: DisputeStatus;

  @ApiProperty()
  @IsBoolean()
  settlementWindowPassed!: boolean;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @ApiProperty({ enum: RoleCode, isArray: true })
  @IsArray()
  actorRoles!: RoleCode[];
}

export class AiActionDto {
  @ApiProperty()
  @IsString()
  agentCode!: string;

  @ApiProperty()
  @IsString()
  requestedAction!: string;

  @ApiPropertyOptional({ enum: AiRiskLevel })
  @IsOptional()
  @IsEnum(AiRiskLevel)
  riskLevel?: AiRiskLevel;

  @ApiProperty({ enum: RoleCode, isArray: true })
  @IsArray()
  actorRoles!: RoleCode[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  approvalCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  l2AutoPolicyEnabled?: boolean;
}

export class GenericCreateDto {
  @ApiProperty()
  @IsObject()
  data!: Record<string, unknown>;
}

export class WarehousePackageDto {
  @ApiProperty()
  @IsString()
  packageId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class RefundDto {
  @ApiProperty()
  @IsString()
  paymentId!: string;

  @ApiProperty()
  @IsString()
  accountId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class DisputeEvidenceDto {
  @ApiProperty()
  @IsString()
  disputeId!: string;

  @ApiProperty()
  @IsString()
  evidenceType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class TrackingEventDto {
  @ApiProperty()
  @IsString()
  shipmentId!: string;

  @ApiProperty()
  @IsString()
  eventCode!: string;

  @ApiProperty()
  @IsString()
  actorType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
