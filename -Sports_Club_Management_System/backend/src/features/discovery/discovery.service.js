const discoveryRepository = require('./discovery.repository');
const bookingsRepository = require('../bookings/bookings.repository');

class DiscoveryService {
  /**
   * Search clubs with coordinate validation, radius, city fallback, and availability indicators
   */
  async searchClubs(query) {
    let { lat, lng, radiusKm, city, sportType, date } = query;

    let parsedLat = undefined;
    let parsedLng = undefined;
    let parsedRadius = undefined;

    if (lat !== undefined && lng !== undefined && lat !== '' && lng !== '') {
      parsedLat = parseFloat(lat);
      parsedLng = parseFloat(lng);

      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        const err = new Error('Invalid latitude: must be between -90 and 90 degrees.');
        err.statusCode = 400;
        throw err;
      }

      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        const err = new Error('Invalid longitude: must be between -180 and 180 degrees.');
        err.statusCode = 400;
        throw err;
      }

      parsedRadius = radiusKm ? parseFloat(radiusKm) : 25.0; // default 25 km radius
      if (isNaN(parsedRadius) || parsedRadius <= 0 || parsedRadius > 200) {
        const err = new Error('Invalid radius: must be between 1 and 200 km.');
        err.statusCode = 400;
        throw err;
      }
    }

    const clubs = await discoveryRepository.searchClubs({
      lat: parsedLat,
      lng: parsedLng,
      radiusKm: parsedRadius,
      city: city ? city.trim() : null,
      sportType: sportType ? sportType.trim() : null,
      date,
    });

    return clubs.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      city: c.city,
      ratingBadge: c.rating_badge || 'BRONZE',
      distanceKm: c.distance_km !== null ? parseFloat(c.distance_km) : null,
      courtCount: parseInt(c.court_count, 10),
      minBasePrice: c.min_base_price ? parseFloat(c.min_base_price) : null,
      openTime: c.open_time,
      closeTime: c.close_time,
    }));
  }

  /**
   * Get user's active multi-club relationships and memberships
   */
  async getUserClubMemberships(userId) {
    return discoveryRepository.getUserClubMemberships(userId);
  }
}

module.exports = new DiscoveryService();
