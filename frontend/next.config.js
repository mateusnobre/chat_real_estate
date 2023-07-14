const env = require('dotenv').config({ path: './.env' });

module.exports = {
  target: 'server',
  serverRuntimeConfig: {},
  publicRuntimeConfig: {
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY,
    },
    isTestMode:
      process.env.STRIPE_PUBLIC_KEY &&
      process.env.STRIPE_PUBLIC_KEY.indexOf('pk') > -1,
  },
  settings: {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  }
};