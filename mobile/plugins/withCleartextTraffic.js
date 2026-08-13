const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Get the main application
    const application = androidManifest.manifest.application[0];
    
    // Add usesCleartextTraffic attribute to the application
    if (application) {
      application.$['android:usesCleartextTraffic'] = 'true';
    }
    
    return config;
  });
};