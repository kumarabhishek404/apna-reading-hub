const { withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Hardens Android Gradle wrapper downloads on EAS:
 * - prefer the smaller -bin distribution (less CDN pressure than -all)
 * - raise networkTimeout so brief GitHub 503s can recover
 *
 * The original EAS failure was:
 *   Server returned HTTP response code: 503 for URL:
 *   https://github.com/gradle/gradle-distributions/releases/download/...
 */
function withGradleWrapperResilience(config) {
  config = withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;

    const setOrAdd = (key, value) => {
      const existing = props.find((item) => item.type === 'property' && item.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    // Help intermittent dependency/CDN flakes on EAS workers.
    setOrAdd('org.gradle.daemon', 'true');
    setOrAdd('org.gradle.parallel', 'true');
    setOrAdd('org.gradle.jvmargs', '-Xmx2048m -XX:MaxMetaspaceSize=512m');

    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const wrapperPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties',
      );

      if (!fs.existsSync(wrapperPath)) {
        return cfg;
      }

      let contents = fs.readFileSync(wrapperPath, 'utf8');

      // Prefer -bin over -all (smaller download; same Gradle runtime).
      contents = contents.replace(
        /distributionUrl=.*gradle-([0-9.]+)-all\.zip/,
        'distributionUrl=https\\://services.gradle.org/distributions/gradle-$1-bin.zip',
      );

      if (!/networkTimeout=/.test(contents)) {
        contents += '\nnetworkTimeout=120000\n';
      } else {
        contents = contents.replace(/networkTimeout=\d+/g, 'networkTimeout=120000');
      }

      if (!/validateDistributionUrl=/.test(contents)) {
        contents += 'validateDistributionUrl=true\n';
      }

      fs.writeFileSync(wrapperPath, contents);
      return cfg;
    },
  ]);

  return config;
}

module.exports = withGradleWrapperResilience;
