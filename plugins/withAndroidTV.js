const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidTV(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];
    const activity = application.activity.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );

    // 1. Add hardware features for TV
    if (!manifest.manifest['uses-feature']) {
      manifest.manifest['uses-feature'] = [];
    }

    // Add leanback support (false meaning it can still run on phones)
    if (!manifest.manifest['uses-feature'].some((f) => f.$['android:name'] === 'android.software.leanback')) {
      manifest.manifest['uses-feature'].push({
        $: {
          'android:name': 'android.software.leanback',
          'android:required': 'true',
        },
      });
    }

    // Add touchscreen explicitly set to false so it's not strictly required
    if (!manifest.manifest['uses-feature'].some((f) => f.$['android:name'] === 'android.hardware.touchscreen')) {
      manifest.manifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.touchscreen',
          'android:required': 'false',
        },
      });
    }

    // 2. Add LEANBACK_LAUNCHER intent filter category
    if (activity && activity['intent-filter']) {
      const intentFilter = activity['intent-filter'].find(
        (filter) => filter.action && filter.action.some((a) => a.$['android:name'] === 'android.intent.action.MAIN')
      );

      if (intentFilter && intentFilter.category) {
        if (!intentFilter.category.some((c) => c.$['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER')) {
          intentFilter.category.push({
            $: {
              'android:name': 'android.intent.category.LEANBACK_LAUNCHER',
            },
          });
        }
      }
    }

    return config;
  });
};
