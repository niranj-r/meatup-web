export const STORE_LOCATION = {
    latitude: 8.5459,
    longitude: 76.9063, // Engineering College, Sreekaryam
};

// Haversine formula to calculate distance between two points
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const calculateDeliveryTime = (distanceKm: number): number => {
    // Road factor: Multiply straight line distance by 1.4 to estimate road distance
    const roadDistance = distanceKm * 1.4;

    const baseTime = 30; // 30 mins for first 7 km
    const baseDistance = 7;

    if (roadDistance <= baseDistance) {
        return baseTime;
    }

    const extraDistance = roadDistance - baseDistance;
    const extraTime = Math.ceil(extraDistance) * 3; // 3 mins per extra km

    return baseTime + extraTime;
};
