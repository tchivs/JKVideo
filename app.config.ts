import type { ExpoConfig, ConfigContext } from 'expo/config';

const isTV = process.env.APP_VARIANT === 'tv';

const phoneConfig = require('./app.json').expo;
const tvConfig = require('./app.tv.json').expo;

const base = isTV ? tvConfig : phoneConfig;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...base,
});
