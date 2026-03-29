
/**
 * Calculates distance between two points in kilometers using Haversine formula
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const getDistanceLabel = (dist: number): string => {
  if (dist < 1) return 'Within 1 km';
  return `${dist.toFixed(1)} km away`;
};

/**
 * Maps common locales to their international calling codes and flags
 */
const COUNTRY_MAP: Record<string, { code: string; flag: string; name: string }> = {
  'US': { code: '+1', flag: '🇺🇸', name: 'USA' },
  'GB': { code: '+44', flag: '🇬🇧', name: 'UK' },
  'IN': { code: '+91', flag: '🇮🇳', name: 'India' },
  'CA': { code: '+1', flag: '🇨🇦', name: 'Canada' },
  'AU': { code: '+61', flag: '🇦🇺', name: 'Australia' },
  'DE': { code: '+49', flag: '🇩🇪', name: 'Germany' },
  'FR': { code: '+33', flag: '🇫🇷', name: 'France' },
  'BR': { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  'JP': { code: '+81', flag: '🇯🇵', name: 'Japan' },
  'SG': { code: '+65', flag: '🇸🇬', name: 'Singapore' },
};

export const getLocalCountryData = () => {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
    const countryCode = locale.split('-')[1] || 'US';
    return COUNTRY_MAP[countryCode] || COUNTRY_MAP['US'];
  } catch (e) {
    return COUNTRY_MAP['US'];
  }
};
