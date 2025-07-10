module.exports = {
  apps: [{
    name: 'greenroasteries',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/greenroasteries',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: '1'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: '1'
    },
    log_file: '/var/log/pm2/greenroasteries.log',
    out_file: '/var/log/pm2/greenroasteries-out.log',
    error_file: '/var/log/pm2/greenroasteries-error.log',
    time: true,
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: [
      'node_modules',
      '.next',
      'logs',
      '*.log'
    ]
  }]
}; 