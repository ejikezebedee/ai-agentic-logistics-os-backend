import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { EncryptionService } from './common/encryption.service';
import { RbacService } from './modules/rbac/rbac.service';
import { AuditLogService } from './modules/audit/audit-log.service';
import { LedgerService } from './modules/ledger/ledger.service';
import { StateMachineService } from './modules/shipments/state-machine.service';
import { LogisticsPolicyService } from './modules/shipments/logistics-policy.service';
import { AiGovernanceService } from './modules/ai/ai-governance.service';
import { ProofValidationService } from './modules/tracking/proof-validation.service';
import { AuthController } from './modules/auth/auth.controller';
import { UsersController } from './modules/users/users.controller';
import { RolesController } from './modules/rbac/roles.controller';
import { AuditController } from './modules/audit/audit.controller';
import { LedgerController } from './modules/ledger/ledger.controller';
import { OrdersController } from './modules/orders/orders.controller';
import { ShipmentsController } from './modules/shipments/shipments.controller';
import { WarehouseController } from './modules/warehouse/warehouse.controller';
import { DisponentController } from './modules/disponent/disponent.controller';
import { DriverController, DriversController } from './modules/drivers/driver.controller';
import { PaymentsController } from './modules/payments/payments.controller';
import { EscrowController } from './modules/escrow/escrow.controller';
import { DisputesController } from './modules/disputes/disputes.controller';
import { TrackingController } from './modules/tracking/tracking.controller';
import { AiController } from './modules/ai/ai.controller';
import { DocumentsController } from './modules/documents/documents.controller';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { GenericResourceController } from './modules/admin/generic-resource.controller';
import { ReturnsController } from './modules/returns/returns.controller';
import { ApprovalsController } from './modules/approvals/approvals.controller';
import { OperationsService } from './modules/shipments/operations.service';
import { WarehouseFlowService } from './modules/warehouse/warehouse-flow.service';
import { TrackingEventService } from './modules/tracking/tracking-event.service';
import { DisputeWorkflowService } from './modules/disputes/dispute-workflow.service';
import { DocumentStorageService } from './modules/documents/document-storage.service';
import { NotificationService } from './modules/notifications/notification.service';
import { LocationService } from './modules/tracking/location.service';
import { AiWorkflowService } from './modules/ai/ai-workflow.service';
import { AuthService } from './modules/auth/auth.service';
import { ProviderAdapterService } from './modules/adapters/provider-adapter.service';
import { ProviderAdaptersController } from './modules/adapters/provider-adapters.controller';
import { PackagesController } from './modules/packages/packages.controller';
import { DispatchController } from './modules/dispatch/dispatch.controller';
import { CorrelationMiddleware } from './common/correlation.middleware';
import { ObservabilityController } from './modules/observability/observability.controller';
import { ObservabilityService } from './modules/observability/observability.service';
import { QueuesController } from './modules/queues/queues.controller';
import { QueueService } from './modules/queues/queue.service';
import { MetaController } from './modules/meta/meta.controller';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [
    AuthController,
    UsersController,
    RolesController,
    AuditController,
    LedgerController,
    OrdersController,
    ShipmentsController,
    WarehouseController,
    DisponentController,
    DriverController,
    DriversController,
    PaymentsController,
    EscrowController,
    DisputesController,
    TrackingController,
    AiController,
    DocumentsController,
    NotificationsController,
    ReturnsController,
    ApprovalsController,
    PackagesController,
    DispatchController,
    ObservabilityController,
    QueuesController,
    ProviderAdaptersController,
    MetaController,
    GenericResourceController
  ],
  providers: [
    PrismaService,
    EncryptionService,
    RbacService,
    AuditLogService,
    LedgerService,
    StateMachineService,
    LogisticsPolicyService,
    AiGovernanceService,
    ProofValidationService,
    OperationsService,
    WarehouseFlowService,
    TrackingEventService,
    DisputeWorkflowService,
    DocumentStorageService,
    NotificationService,
    LocationService,
    AiWorkflowService,
    AuthService,
    ProviderAdapterService,
    ObservabilityService,
    QueueService
  ],
  exports: [
    PrismaService,
    RbacService,
    AuditLogService,
    LedgerService,
    StateMachineService,
    LogisticsPolicyService,
    AiGovernanceService,
    ProofValidationService,
    OperationsService,
    WarehouseFlowService,
    TrackingEventService,
    DisputeWorkflowService,
    DocumentStorageService,
    NotificationService,
    LocationService,
    AiWorkflowService,
    AuthService,
    ProviderAdapterService,
    ObservabilityService,
    QueueService
  ]
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
