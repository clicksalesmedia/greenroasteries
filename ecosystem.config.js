module.exports = {
  apps: [{
    name: 'greenroasteries',
    script: '.next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: './.env'
  }]
};
