export const API_VERSION = '0.1.0-rc.1';
export const API_CONTRACT_STATUS = 'release_candidate';
export const API_BREAKING_CHANGE_POLICY = 'No breaking changes to documented request or response shapes without a new API version marker and frontend migration notes.';

export const FRONTEND_CRITICAL_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/sessions',
  '/orders',
  '/warehouse/pick/start',
  '/warehouse/scan',
  '/warehouse/pack',
  '/warehouse/ready-for-dispatch',
  '/disponent/tour-plans',
  '/disponent/tour-plans/{id}/approve',
  '/disponent/assign-driver',
  '/driver/pickup/{shipmentId}/complete',
  '/driver/delivery/{shipmentId}/complete',
  '/driver/location',
  '/tracking/{shipmentId}',
  '/escrow/release',
  '/payments/refunds',
  '/ledger',
  '/ai/disponent/tour-recommendations',
  '/ai/finance/refund-recommendation',
  '/ai/actions/authorize',
  '/approvals',
  '/provider-adapters/catalog',
  '/meta/version',
  '/meta/contract'
] as const;
