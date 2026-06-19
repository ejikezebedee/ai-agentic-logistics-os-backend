import { Injectable } from '@nestjs/common';
import { TrackingEventCode } from '../../common/domain.enums';
import { TrackingEventService } from './tracking-event.service';

export type DriverLocation = {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  shipmentId?: string;
  recordedAt: Date;
};

@Injectable()
export class LocationService {
  private readonly locations = new Map<string, DriverLocation>();

  constructor(private readonly tracking: TrackingEventService) {}

  checkIn(input: Omit<DriverLocation, 'recordedAt'>): DriverLocation {
    const location = Object.freeze({ ...input, recordedAt: new Date() });
    this.locations.set(input.driverId, location);
    if (input.shipmentId) {
      this.tracking.append({
        shipmentId: input.shipmentId,
        eventCode: 'driver.location_check_in',
        actorType: 'driver',
        actorId: input.driverId,
        location: { latitude: input.latitude, longitude: input.longitude, accuracyMeters: input.accuracyMeters }
      });
    }
    return location;
  }

  routeDeviation(input: { shipmentId: string; driverId: string; latitude: number; longitude: number; reason: string }) {
    return this.tracking.append({
      shipmentId: input.shipmentId,
      eventCode: TrackingEventCode.SHIPMENT_ROUTE_DEVIATION_DETECTED,
      actorType: 'driver',
      actorId: input.driverId,
      location: { latitude: input.latitude, longitude: input.longitude },
      metadata: { reason: input.reason }
    });
  }

  liveMap() {
    return { drivers: [...this.locations.values()] };
  }
}
