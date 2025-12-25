module.exports = {
    apps: [
      {
        name: "brahamand",
  
        // ---- WORKING DIRECTORY ----
        cwd: "/home/ubuntu/htdocs/brahamand",
  
      // ---- START USING PNPM (IMPORTANT) ----
      script: "/home/ubuntu/.local/share/pnpm/pnpm",
      args: "start",
      interpreter: "bash",
  
        // ---- ABSOLUTE SAFETY ----
        instances: 1,          // NEVER > 1
        exec_mode: "fork",     // NEVER cluster
  
        // ---- RESTART CONTROL ----
        autorestart: true,
        max_restarts: 3,       // prevent restart storms
        restart_delay: 10000,  // 10 seconds
  
        // ---- HARD MEMORY LIMIT ----
        max_memory_restart: "300M",
  
        // ---- ENV ----
        env: {
          NODE_ENV: "production",
          PORT: 3001
        },
  
        // ---- LOGGING (LOCAL, ROTATABLE) ----
        error_file: "logs/pm2-error.log",
        out_file: "logs/pm2-out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
  
        // ---- SHUTDOWN SAFETY ----
        kill_timeout: 5000,
        listen_timeout: 30000,
        wait_ready: false
      }
    ]
  };
  