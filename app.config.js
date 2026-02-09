// Dynamic Expo config to allow injecting build-time secrets (e.g., Google Maps API key)
// without committing them to source control.

module.exports = ({ config }) => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    config?.android?.config?.googleMaps?.apiKey ||
    config?.ios?.config?.googleMapsApiKey;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          ...(config.android?.config?.googleMaps || {}),
          apiKey: googleMapsApiKey || config.android?.config?.googleMaps?.apiKey
        }
      }
    },
    ios: {
      ...config.ios,
      config: {
        ...(config.ios?.config || {}),
        googleMapsApiKey: googleMapsApiKey || config.ios?.config?.googleMapsApiKey
      }
    }
  };
};
