import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiRiskLevel, DisputeStatus, PackageStatus, PaymentStatus, ProofTier, RoleCode } from './domain.enums';

export class IdParamDto {
  @ApiProperty({ type: String })
  @IsString()
  id!: string;
}

export class OrderItemDto {
  @ApiProperty({ type: String })
  @IsString()
  skuId!: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: String })
  @IsString()
  merchantId!: string;

  @ApiProperty({ type: String })
  @IsString()
  customerId!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

export class AssignDriverDto {
  @ApiProperty({ type: String })
  @IsString()
  shipmentId!: string;

  @ApiProperty({ type: String })
  @IsString()
  driverId!: string;

  @ApiPropertyOptional({ enum: PackageStatus, default: PackageStatus.READY_FOR_DISPATCH })
  @IsOptional()
  @IsEnum(PackageStatus)
  packageStatus?: PackageStatus;
}

export class CreateShipmentDto {
  @ApiProperty({ type: String, description: 'Existing order id returned by POST /orders or seeded dev order id.' })
  @IsString()
  orderId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  packageBarcode?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for packageBarcode.' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  origin?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  destination?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class GpsDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  latitude!: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  withinTolerance?: boolean;

  @ApiPropertyOptional({ type: Number, description: 'Frontend alias for latitude.' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ type: Number, description: 'Frontend alias for longitude.' })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class DeliveryProofDto {
  @ApiPropertyOptional({ enum: ProofTier, default: ProofTier.LOW_VALUE })
  @IsOptional()
  @IsEnum(ProofTier)
  tier!: ProofTier;

  @ApiProperty({ type: GpsDto })
  @ValidateNested()
  @Type(() => GpsDto)
  gps!: GpsDto;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  photoObjectKey?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  signatureObjectKey?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  idCheckReference?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  packageScanCode?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  disponentOverrideApprovalId?: string;
}

export class PickupProofDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  packageScanCode?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  photoObjectKey?: string;
}

export class EscrowReleaseDto {
  @ApiProperty({ type: String })
  @IsString()
  accountId!: string;

  @ApiProperty({ type: String })
  @IsString()
  shipmentId!: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  amount!: number;

  @ApiProperty({ type: String })
  @IsString()
  currency!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  proofAccepted!: boolean;

  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  disputeStatus!: DisputeStatus;

  @ApiProperty({ type: Boolean })
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
  @ApiProperty({ type: String })
  @IsString()
  agentCode!: string;

  @ApiProperty({ type: String })
  @IsString()
  requestedAction!: string;

  @ApiPropertyOptional({ enum: AiRiskLevel })
  @IsOptional()
  @IsEnum(AiRiskLevel)
  riskLevel?: AiRiskLevel;

  @ApiProperty({ enum: RoleCode, isArray: true })
  @IsArray()
  actorRoles!: RoleCode[];

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  approvalCount?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  l2AutoPolicyEnabled?: boolean;
}

export class GenericCreateDto {
  @ApiProperty({ type: Object })
  @IsObject()
  data!: Record<string, unknown>;
}

export class WarehousePackageDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  packageId?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for packageId.' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class RefundDto {
  @ApiProperty({ type: String })
  @IsString()
  paymentId!: string;

  @ApiProperty({ type: String })
  @IsString()
  accountId!: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  amount!: number;

  @ApiProperty({ type: String })
  @IsString()
  currency!: string;

  @ApiProperty({ type: String })
  @IsString()
  reason!: string;
}

export class DisputeEvidenceDto {
  @ApiProperty({ type: String })
  @IsString()
  disputeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  evidenceType!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class TrackingEventDto {
  @ApiProperty({ type: String })
  @IsString()
  shipmentId!: string;

  @ApiProperty({ type: String })
  @IsString()
  eventCode!: string;

  @ApiProperty({ type: String })
  @IsString()
  actorType!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateReturnDto {
  @ApiProperty({ type: String })
  @IsString()
  orderId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  shipmentId?: string;

  @ApiProperty({ type: String })
  @IsString()
  customerId!: string;

  @ApiProperty({ type: String })
  @IsString()
  reason!: string;
}

export class UpdateReturnStatusDto {
  @ApiProperty({
    enum: ['return_requested', 'return_approved', 'return_rejected', 'return_pickup_planned', 'return_picked_up', 'return_received', 'inspection_pending', 'refund_pending', 'refund_completed', 'restocked', 'discarded', 'closed']
  })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  inspection?: Record<string, unknown>;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  refundId?: string;
}

export class ApprovalRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  actionCode!: string;

  @ApiPropertyOptional({ enum: AiRiskLevel })
  @IsOptional()
  @IsEnum(AiRiskLevel)
  riskLevel?: AiRiskLevel;

  @ApiProperty({ type: Object })
  @IsObject()
  context!: Record<string, unknown>;
}

export class ApprovalDecisionDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  decision!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CommentDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class AiProviderCreateDto {
  @ApiProperty({ type: String })
  @IsString()
  apiKey!: string;

  @ApiProperty({ type: String })
  @IsString()
  providerName!: string;
}

export class AiProviderTestDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class LoginDto {
  @ApiProperty({ type: String })
  @IsString()
  email!: string;

  @ApiProperty({ type: String })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ type: String })
  @IsString()
  refreshToken!: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  email!: string;
}

export class PasswordResetCompleteDto {
  @ApiProperty({ type: String })
  @IsString()
  token!: string;

  @ApiProperty({ type: String })
  @IsString()
  newPassword!: string;
}

export class TwoFactorVerifyDto {
  @ApiProperty({ type: String })
  @IsString()
  challengeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  code!: string;
}
