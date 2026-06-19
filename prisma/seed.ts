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
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
