import { PrismaClient, RoleCode, AiRiskLevel } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const roleNames: Record<RoleCode, string> = {
  customer: 'Customer',
  merchant: 'Merchant',
  shipper: 'Shipper',
  warehouse_staff: 'Warehouse Staff',
  warehouse_manager: 'Warehouse Manager',
  driver: 'Driver',
  fleet_manager: 'Fleet Manager',
  carrier: 'Carrier',
  freight_forwarder: 'Freight Forwarder',
  logistic_disponent: 'Logistic Disponent / Logistikdisponent',
  support_agent: 'Support Agent',
  finance_admin: 'Finance Admin',
  compliance_admin: 'Compliance Admin',
  super_admin: 'Super Admin',
  ai_agent: 'AI Agent'
};

const aiAgents = [
  ['ai_logistics_orchestrator', 'AI Logistics Orchestrator'],
  ['ai_order_agent', 'AI Order Agent'],
  ['ai_pricing_agent', 'AI Pricing Agent'],
  ['ai_warehouse_agent', 'AI Warehouse Agent'],
  ['ai_disponent_agent', 'AI Disponent Agent'],
  ['ai_dispatch_agent', 'AI Dispatch Agent'],
  ['ai_route_agent', 'AI Route Agent'],
  ['ai_tracking_agent', 'AI Tracking Agent'],
  ['ai_exception_agent', 'AI Exception Agent'],
  ['ai_finance_agent', 'AI Finance Agent'],
  ['ai_dispute_agent', 'AI Dispute Agent'],
  ['ai_compliance_agent', 'AI Compliance Agent'],
  ['ai_support_agent', 'AI Support Agent'],
  ['ai_analytics_agent', 'AI Analytics Agent']
] as const;

async function upsertUser(email: string, displayName: string, roleCode: RoleCode) {
  const passwordHash = await hash('ChangeMe-Local-Only-123!', 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName, passwordHash }
  });
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id }
  });
  return user;
}

async function upsertDevUser(id: string, email: string, displayName: string, roleCode: RoleCode) {
  const passwordHash = await hash('ChangeMe-Local-Only-123!', 12);
  const user = await prisma.user.upsert({
    where: { id },
    update: { email, displayName },
    create: { id, email, displayName, passwordHash }
  });
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id }
  });
  return user;
}

async function main() {
  for (const [code, name] of Object.entries(roleNames) as Array<[RoleCode, string]>) {
    await prisma.role.upsert({
      where: { code },
      update: { name },
      create: { code, name, description: `${name} operational role` }
    });
  }

  const superAdmin = await upsertUser('superadmin@example.local', 'Super Admin', 'super_admin');
  const disponentUser = await upsertUser('disponent@example.local', 'Logistikdisponent', 'logistic_disponent');
  const warehouseUser = await upsertUser('warehouse@example.local', 'Warehouse Staff', 'warehouse_staff');
  const driverUser = await upsertUser('driver@example.local', 'Driver One', 'driver');
  const merchantUser = await upsertUser('merchant@example.local', 'Merchant One', 'merchant');
  const customerUser = await upsertUser('customer@example.local', 'Customer One', 'customer');
  await upsertUser('finance@example.local', 'Finance Admin', 'finance_admin');

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: { userId: customerUser.id, kycStatus: 'verified' }
  });
  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: { userId: merchantUser.id, businessName: 'Sample Merchant GmbH', kycStatus: 'verified' }
  });
  await prisma.disponent.upsert({
    where: { userId: disponentUser.id },
    update: {},
    create: { userId: disponentUser.id, region: 'DE-NRW' }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-DUS-01' },
    update: {},
    create: { name: 'Duisburg Sample Warehouse', code: 'WH-DUS-01', address: { city: 'Duisburg', country: 'DE' } }
  });
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: 'DU-LOG-100' },
    update: {},
    create: { plateNumber: 'DU-LOG-100', vehicleType: 'van', status: 'available' }
  });
  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { vehicleId: vehicle.id },
    create: { userId: driverUser.id, vehicleId: vehicle.id, status: 'online', licenseNumber: 'LOCAL-SEED' }
  });
  await prisma.warehouseStaff.upsert({
    where: { userId: warehouseUser.id },
    update: { warehouseId: warehouse.id },
    create: { userId: warehouseUser.id, warehouseId: warehouse.id }
  });

  const product = await prisma.product.create({
    data: { merchantId: merchant.id, name: 'Sample Industrial Spare Part', description: 'Seed SKU for operational testing.' }
  });
  const sku = await prisma.sku.create({
    data: { productId: product.id, code: `SKU-${Date.now()}`, barcode: `BAR-${Date.now()}`, weightKg: '1.500', dimensions: { lengthCm: 20, widthCm: 12, heightCm: 8 } }
  });
  await prisma.inventoryItem.create({
    data: { skuId: sku.id, warehouseId: warehouse.id, state: 'available', quantity: 10 }
  });
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      merchantId: merchant.id,
      status: 'payment_authorized',
      totalAmount: '149.00',
      currency: 'EUR',
      items: { create: [{ skuId: sku.id, quantity: 1, unitPrice: '149.00' }] }
    }
  });
  const shipment = await prisma.shipment.create({
    data: { orderId: order.id, status: 'awaiting_dispatch', custodyType: 'warehouse', responsibility: 'warehouse_staff' }
  });
  await prisma.package.create({
    data: { shipmentId: shipment.id, status: 'ready_for_dispatch', barcode: `PKG-${Date.now()}`, scannedAt: new Date(), packedAt: new Date(), stagedAt: new Date() }
  });
  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: 'sample_provider',
      status: 'held_in_escrow',
      amount: '149.00',
      currency: 'EUR',
      escrowAccount: { create: { balance: '149.00', currency: 'EUR', status: 'held_in_escrow' } }
    }
  });

  await prisma.aiProvider.create({
    data: {
      ownerType: 'platform',
      ownerId: superAdmin.id,
      providerName: 'placeholder',
      model: 'not-configured',
      encryptedApiKey: 'placeholder-encrypted-key',
      allowedAgents: aiAgents.map(([code]) => code),
      status: 'disabled'
    }
  });
  for (const [code, name] of aiAgents) {
    const agent = await prisma.aiAgent.upsert({
      where: { code },
      update: { name },
      create: { code, name, description: `${name} for logistics operating control.` }
    });
    await prisma.aiAgentCapability.upsert({
      where: { agentId_capabilityCode: { agentId: agent.id, capabilityCode: 'recommend' } },
      update: {},
      create: { agentId: agent.id, capabilityCode: 'recommend', riskLevel: AiRiskLevel.L1_LOW }
    });
  }

  await seedIntegration7GFixtureRecords();
}

async function seedIntegration7GFixtureRecords() {
  const customerUser = await upsertDevUser('cust_7f_user', 'cust-7f@example.local', 'Integration 7F Customer', 'customer');
  const merchantUser = await upsertDevUser('merchant_7f_user', 'merchant-7f@example.local', 'Integration 7F Merchant', 'merchant');
  const driverUser = await upsertDevUser('driver_7f_user', 'driver-7f@example.local', 'Integration 7F Driver', 'driver');
  await upsertDevUser('dispatcher_7f', 'dispatcher-7f@example.local', 'Integration 7F Dispatcher', 'logistic_disponent');
  await upsertDevUser('wh_7f', 'warehouse-7f@example.local', 'Integration 7F Warehouse Operator', 'warehouse_staff');
  await upsertDevUser('warehouse_manager_7f', 'warehouse-manager-7f@example.local', 'Integration 7F Warehouse Manager', 'warehouse_manager');
  await upsertDevUser('support_7f', 'support-7f@example.local', 'Integration 7F Support', 'support_agent');
  await upsertDevUser('finance_7f', 'finance-7f@example.local', 'Integration 7F Finance', 'finance_admin');
  await upsertDevUser('compliance_7f', 'compliance-7f@example.local', 'Integration 7F Compliance', 'compliance_admin');
  await upsertDevUser('admin_7f', 'admin-7f@example.local', 'Integration 7F Admin', 'super_admin');
  await upsertDevUser('ai_7f', 'ai-7f@example.local', 'Integration 7F AI Agent', 'ai_agent');

  const customer = await prisma.customer.upsert({
    where: { id: 'cust_7f' },
    update: { userId: customerUser.id, kycStatus: 'verified' },
    create: { id: 'cust_7f', userId: customerUser.id, kycStatus: 'verified' }
  });
  const merchant = await prisma.merchant.upsert({
    where: { id: 'merchant_7f' },
    update: { userId: merchantUser.id, businessName: 'Integration 7F Merchant GmbH', kycStatus: 'verified' },
    create: { id: 'merchant_7f', userId: merchantUser.id, businessName: 'Integration 7F Merchant GmbH', kycStatus: 'verified' }
  });
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-7F-01' },
    update: { name: 'Integration 7F Warehouse', address: { city: 'Duisburg', country: 'DE' } },
    create: { id: 'wh_7f_record', name: 'Integration 7F Warehouse', code: 'WH-7F-01', address: { city: 'Duisburg', country: 'DE' } }
  });
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: 'DU-7F-001' },
    update: { status: 'available' },
    create: { id: 'vehicle_7f', plateNumber: 'DU-7F-001', vehicleType: 'van', status: 'available' }
  });
  await prisma.driver.upsert({
    where: { id: 'driver_7f' },
    update: { userId: driverUser.id, vehicleId: vehicle.id, status: 'online' },
    create: { id: 'driver_7f', userId: driverUser.id, vehicleId: vehicle.id, status: 'online', licenseNumber: 'LOCAL-7F' }
  });
  await prisma.warehouseStaff.upsert({
    where: { userId: 'wh_7f' },
    update: { warehouseId: warehouse.id },
    create: { userId: 'wh_7f', warehouseId: warehouse.id }
  });

  const product = await prisma.product.upsert({
    where: { id: 'prod_7f' },
    update: { merchantId: merchant.id, name: 'Integration 7F Product' },
    create: { id: 'prod_7f', merchantId: merchant.id, name: 'Integration 7F Product', description: 'Deterministic SKU container for 7G replay.' }
  });
  for (const skuId of ['sku_7f', 'sku_alias_7f', 'item_7f']) {
    await prisma.sku.upsert({
      where: { id: skuId },
      update: { productId: product.id, code: skuId.toUpperCase() },
      create: { id: skuId, productId: product.id, code: skuId.toUpperCase(), barcode: `${skuId.toUpperCase()}-BAR`, weightKg: '1.000', dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 } }
    });
  }

  const order = await prisma.order.upsert({
    where: { id: 'ord_7f' },
    update: { customerId: customer.id, merchantId: merchant.id, status: 'payment_authorized', totalAmount: '149.00', currency: 'EUR' },
    create: { id: 'ord_7f', customerId: customer.id, merchantId: merchant.id, status: 'payment_authorized', totalAmount: '149.00', currency: 'EUR' }
  });
  await prisma.orderItem.upsert({
    where: { id: 'ord_item_7f' },
    update: { orderId: order.id, skuId: 'sku_7f', quantity: 1, unitPrice: '149.00' },
    create: { id: 'ord_item_7f', orderId: order.id, skuId: 'sku_7f', quantity: 1, unitPrice: '149.00' }
  });

  const shipment = await prisma.shipment.upsert({
    where: { id: 'ship_7f' },
    update: { orderId: order.id, status: 'awaiting_dispatch', custodyType: 'warehouse', responsibility: 'warehouse_staff' },
    create: { id: 'ship_7f', orderId: order.id, status: 'awaiting_dispatch', custodyType: 'warehouse', responsibility: 'warehouse_staff' }
  });
  for (const packageId of ['PKG-7F-WF', 'PKG-7F-RBAC-002']) {
    await prisma.package.upsert({
      where: { id: packageId },
      update: { shipmentId: shipment.id, status: 'ready_for_dispatch', barcode: packageId, scannedAt: new Date(), packedAt: new Date(), stagedAt: new Date() },
      create: { id: packageId, shipmentId: shipment.id, status: 'ready_for_dispatch', barcode: packageId, scannedAt: new Date(), packedAt: new Date(), stagedAt: new Date() }
    });
  }
  await prisma.return.upsert({
    where: { id: 'ret_7f' },
    update: { orderId: order.id, shipmentId: shipment.id, customerId: customer.id, status: 'return_requested', reason: 'integration-7f' },
    create: { id: 'ret_7f', orderId: order.id, shipmentId: shipment.id, customerId: customer.id, status: 'return_requested', reason: 'integration-7f' }
  });
  for (const approvalId of ['apr_7f', 'apr_refund_7f']) {
    await prisma.approvalRequest.upsert({
      where: { id: approvalId },
      update: { requesterType: 'ai_agent', requesterId: 'ai_7f', actionCode: approvalId === 'apr_refund_7f' ? 'refund_approval' : 'driver_reassignment', riskLevel: 'L2_MEDIUM', context: { shipmentId: shipment.id } },
      create: { id: approvalId, requesterType: 'ai_agent', requesterId: 'ai_7f', actionCode: approvalId === 'apr_refund_7f' ? 'refund_approval' : 'driver_reassignment', riskLevel: 'L2_MEDIUM', context: { shipmentId: shipment.id } }
    });
  }
  await prisma.aiProvider.upsert({
    where: { id: 'dev-provider-001' },
    update: { ownerType: 'platform', ownerId: 'admin_7f', providerName: 'dev-provider', model: 'mock-model', encryptedApiKey: 'mock-dev-key', allowedAgents: aiAgents.map(([code]) => code), status: 'active' },
    create: { id: 'dev-provider-001', ownerType: 'platform', ownerId: 'admin_7f', providerName: 'dev-provider', model: 'mock-model', encryptedApiKey: 'mock-dev-key', allowedAgents: aiAgents.map(([code]) => code), status: 'active' }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
