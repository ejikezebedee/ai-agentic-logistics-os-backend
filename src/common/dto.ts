import { Type } from 'class-transformer';
import { Allow, IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiRiskLevel, DisputeStatus, PackageStatus, PaymentStatus, ProofTier, RoleCode } from './domain.enums';

export class IdParamDto {
  @ApiProperty({ type: String })
  @IsString()
  id!: string;
}

export class FrontendWorkflowPayloadDto {
  @ApiPropertyOptional({ type: Object, description: 'Frontend workflow trace field accepted by dev/mock contracts.' })
  @Allow()
  workflow?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend workflow trace field accepted by dev/mock contracts.' })
  @Allow()
  workflowId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend operation trace field accepted by dev/mock contracts.' })
  @Allow()
  operationId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend action trace field accepted by dev/mock contracts.' })
  @Allow()
  frontendAction?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend action trace field accepted by dev/mock contracts.' })
  @Allow()
  action?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend action trace field accepted by dev/mock contracts.' })
  @Allow()
  actionId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend request trace field accepted by dev/mock contracts.' })
  @Allow()
  requestId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend correlation trace field accepted by dev/mock contracts.' })
  @Allow()
  correlationId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend request trace field accepted by dev/mock contracts.' })
  @Allow()
  clientRequestId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend source trace field accepted by dev/mock contracts.' })
  @Allow()
  source?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend timestamp trace field accepted by dev/mock contracts.' })
  @Allow()
  timestamp?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend actor trace field accepted by dev/mock contracts.' })
  @Allow()
  actorId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend actor trace field accepted by dev/mock contracts.' })
  @Allow()
  userId?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend actor trace field accepted by dev/mock contracts.' })
  @Allow()
  role?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend note field accepted by dev/mock contracts.' })
  @Allow()
  notes?: unknown;

  @ApiPropertyOptional({ type: String, description: 'Frontend note field accepted by dev/mock contracts.' })
  @Allow()
  note?: unknown;

}

export class OrderItemDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  skuId!: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for skuId.' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for skuId.' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for skuId.' })
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ type: Number, description: 'Frontend alias for quantity.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  qty?: number;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ type: Number, description: 'Frontend alias for unitPrice.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;
}

export class CreateOrderDto extends FrontendWorkflowPayloadDto {
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

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class AssignDriverDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  shipmentId!: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for shipmentId.' })
  @IsOptional()
  @IsString()
  packageId?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  driverId!: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for driverId.' })
  @IsOptional()
  @IsString()
  assignedDriverId?: string;

  @ApiPropertyOptional({ enum: PackageStatus, default: PackageStatus.READY_FOR_DISPATCH })
  @IsOptional()
  @IsEnum(PackageStatus)
  packageStatus?: PackageStatus;
}

export class CreateShipmentDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String, description: 'Existing order id returned by POST /orders or seeded dev order id.' })
  @IsOptional()
  @IsString()
  orderId!: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for orderId.' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for orderId.' })
  @IsOptional()
  @IsString()
  referenceId?: string;

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
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  withinTolerance?: boolean;

  @ApiPropertyOptional({ type: Number, description: 'Frontend alias for latitude.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ type: Number, description: 'Frontend alias for longitude.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}

export class DeliveryProofDto extends FrontendWorkflowPayloadDto {
  @ApiPropertyOptional({ enum: ProofTier, default: ProofTier.LOW_VALUE })
  @IsOptional()
  @IsEnum(ProofTier)
  tier!: ProofTier;

  @ApiProperty({ type: GpsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GpsDto)
  gps!: GpsDto;

  @ApiPropertyOptional({ type: GpsDto, description: 'Frontend alias for gps.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GpsDto)
  location?: GpsDto;

  @ApiPropertyOptional({ type: Number, description: 'Top-level frontend alias for gps.latitude.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ type: Number, description: 'Top-level frontend alias for gps.longitude.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  photoObjectKey?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for photoObjectKey.' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  signatureObjectKey?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for signatureObjectKey.' })
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  idCheckReference?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  packageScanCode?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for packageScanCode.' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for packageScanCode.' })
  @IsOptional()
  @IsString()
  scanCode?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  disponentOverrideApprovalId?: string;
}

export class PickupProofDto extends FrontendWorkflowPayloadDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  packageScanCode?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for packageScanCode.' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for packageScanCode.' })
  @IsOptional()
  @IsString()
  scanCode?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  photoObjectKey?: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for photoObjectKey.' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class EscrowReleaseDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  accountId!: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  shipmentId!: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiProperty({ type: String })
  @IsString()
  currency!: string;

  @ApiProperty({ type: Boolean })
  @Type(() => Boolean)
  @IsBoolean()
  proofAccepted!: boolean;

  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  disputeStatus!: DisputeStatus;

  @ApiProperty({ type: Boolean })
  @Type(() => Boolean)
  @IsBoolean()
  settlementWindowPassed!: boolean;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @ApiProperty({ enum: RoleCode, isArray: true })
  @IsArray()
  actorRoles!: RoleCode[];
}

export class AiActionDto extends FrontendWorkflowPayloadDto {
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

export class GenericCreateDto extends FrontendWorkflowPayloadDto {
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional({ type: String, description: 'Flat dev/mock resource id alias.' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ type: String, description: 'Flat dev/mock merchant id alias.' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ type: String, description: 'Flat dev/mock customer id alias.' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ type: String, description: 'Flat dev/mock display name alias.' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class WarehousePackageDto extends FrontendWorkflowPayloadDto {
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

export class RefundDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsString()
  paymentId!: string;

  @ApiProperty({ type: String })
  @IsString()
  accountId!: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiProperty({ type: String })
  @IsString()
  currency!: string;

  @ApiProperty({ type: String })
  @IsString()
  reason!: string;
}

export class DisputeEvidenceDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsString()
  disputeId!: string;

  @ApiPropertyOptional({ type: String, default: 'document' })
  @IsOptional()
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

export class CreateReturnDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsString()
  orderId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  shipmentId?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  customerId!: string;

  @ApiProperty({ type: String })
  @IsString()
  reason!: string;
}

export class UpdateReturnStatusDto extends FrontendWorkflowPayloadDto {
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

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ApprovalRequestDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  actionCode!: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for actionCode.' })
  @IsOptional()
  @IsString()
  requestedAction?: string;

  @ApiPropertyOptional({ enum: AiRiskLevel })
  @IsOptional()
  @IsEnum(AiRiskLevel)
  riskLevel?: AiRiskLevel;

  @ApiProperty({ type: Object })
  @IsOptional()
  @IsObject()
  context!: Record<string, unknown>;
}

export class ApprovalDecisionDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsOptional()
  @IsString()
  decision!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CommentDto extends FrontendWorkflowPayloadDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class AiProviderCreateDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  apiKey!: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for apiKey.' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  providerName!: string;

  @ApiPropertyOptional({ type: String, description: 'Frontend alias for providerName.' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class AiProviderTestDto extends FrontendWorkflowPayloadDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class LoginDto extends FrontendWorkflowPayloadDto {
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

export class RefreshTokenDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsString()
  refreshToken!: string;
}

export class PasswordResetRequestDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsString()
  email!: string;
}

export class PasswordResetCompleteDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsString()
  token!: string;

  @ApiProperty({ type: String })
  @IsString()
  newPassword!: string;
}

export class TwoFactorVerifyDto extends FrontendWorkflowPayloadDto {
  @ApiProperty({ type: String })
  @IsString()
  challengeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  code!: string;
}
