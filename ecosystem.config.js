module.exports = {
  apps: [{
    name: 'brahamand',
    script: 'start.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 5,
    restart_delay: 5000,       // 5 seconds delay
    exp_backoff_restart_delay: 200, // exponential backoff
    env:{
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}; 