module.exports = {
  apps: [
    {
      name: 'vong-tich-thanh',
      port: 3000,
      exec_mode: 'cluster',
      instances: 'max', // Hoặc số cụ thể như 2, 4, etc.
      script: './.output/server/index.mjs',
      args: '',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      // Auto restart nếu crash
      autorestart: true,
      // Restart nếu memory vượt quá 1GB
      max_memory_restart: '1G',
      // Delay giữa các lần restart
      restart_delay: 4000,
      // Số lần restart tối đa trong 1 phút
      max_restarts: 10,
      min_uptime: '10s',
      // Log files
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Merge logs từ các cluster instances
      merge_logs: true,
      // Cron để restart định kỳ (optional)
      // cron_restart: '0 0 * * *', // Restart hàng ngày lúc 00:00
    },
  ],

  deploy: {
    production: {
      user: 'root', // Thay bằng username SSH của bạn
      host: 'SSH_HOSTMACHINE', // Thay bằng IP hoặc domain server
      ref: 'origin/main',
      repo: 'git@github.com:pin705/vong_tich_thanh.git',
      path: '/var/www/vong_tich_thanh', // Đường dẫn deploy trên server
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
  },
};
