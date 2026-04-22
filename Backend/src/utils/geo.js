const toRad = (deg) => (deg * Math.PI) / 180;

const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const parseGeofenceConfig = () => {
  const enabled = String(process.env.GEOFENCE_ENABLED || "false").toLowerCase() === "true";
  const officeLatitude = Number(process.env.OFFICE_LATITUDE);
  const officeLongitude = Number(process.env.OFFICE_LONGITUDE);
  const radiusMeters = Number(process.env.GEOFENCE_RADIUS_METERS || 200);

  return {
    enabled,
    officeLatitude,
    officeLongitude,
    radiusMeters,
    validConfig:
      Number.isFinite(officeLatitude) &&
      Number.isFinite(officeLongitude) &&
      Number.isFinite(radiusMeters) &&
      radiusMeters > 0,
  };
};

module.exports = { distanceMeters, parseGeofenceConfig };
