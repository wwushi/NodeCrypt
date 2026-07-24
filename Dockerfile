# Use a Node.js 18 Alpine base image for the backend builder
# 使用 Node.js 18 Alpine 基础镜像作为后端构建器
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy package.json first to leverage Docker's caching
# 首先复制 package.json 以利用 Docker 的缓存
COPY server/package.json ./server/
# Install production dependencies
# 安装生产依赖
RUN cd server && npm install --production --no-package-lock --no-audit

# Copy only the server.js file
# 仅复制 server.js 文件
COPY server/server.js ./server/

# Frontend build stage
# 前端构建阶段
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend dependencies and configuration files
# 复制前端依赖和配置文件
COPY package.json package-lock.json* ./
# Install dependencies
# 安装依赖
RUN npm ci --no-audit || npm install --no-audit

# Copy source code and configuration files
# 复制源代码和配置文件
COPY vite.config.js ./
COPY client/ ./client/

# Build the frontend
# 构建前端
RUN npm run build:docker

# Second stage: Minimal image
# 第二阶段：极小镜像
FROM alpine:3.16

# Install minimal Node.js, Nginx and OpenSSL
# 安装最小化版本的 Node.js、Nginx 和 OpenSSL
RUN apk add --no-cache nodejs nginx openssl && \
    mkdir -p /app/server /app/client /run/nginx && \
    # Clean up apk cache
    # 清理 apk 缓存
    rm -rf /var/cache/apk/*

# Copy server files and static files
# 复制服务器文件和静态文件
COPY --from=backend-builder /app/server/node_modules /app/server/node_modules
COPY --from=backend-builder /app/server/*.js /app/server/
# Copy built frontend files from the frontend build stage
# 从前端构建阶段复制构建好的文件，而不是复制 dist 目录
COPY --from=frontend-builder /app/dist/ /app/client/

# Optimized Nginx configuration with HTTPS support
# 优化的 Nginx 配置，支持 HTTPS
RUN cat > /etc/nginx/nginx.conf <<'EOF'
worker_processes 1;
worker_rlimit_nofile 512;
events { 
    worker_connections 128; 
    multi_accept off;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
    
    # Optimization settings
    # 优化设置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 15;
    types_hash_max_size 1024;
    client_max_body_size 1M;
    client_body_buffer_size 128k;
    
    # Disable access logs to reduce I/O
    # 禁用访问日志以减少 I/O
    access_log off;
    error_log /dev/null;
      # Disable unnecessary features
    # 禁用不需要的功能
    server_tokens off;
    
    # Map to handle WebSocket upgrade detection
    # 映射处理 WebSocket 升级检测
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    # HTTP server to redirect to HTTPS
    # HTTP 服务器，重定向到 HTTPS
    server {
        listen 80;
        server_name localhost;
        
        # Redirect all HTTP requests to HTTPS
        # 将所有 HTTP 请求重定向到 HTTPS
        return 301 https://$host$request_uri;
    }

    # HTTPS server with SSL
    # 带有 SSL 的 HTTPS 服务器
    server {
        listen 443 ssl http2;
        server_name localhost;
        
        # Self-signed certificates for testing (replace with real certificates in production)
        # 用于测试的自签名证书（生产环境请替换为真实证书）
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL settings
        # SSL 设置
        ssl_session_timeout 1d;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
        
        # Serve static files for all regular HTTPS requests
        # 为所有常规 HTTPS 请求提供静态文件
        location / {
            root /app/client;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
        
        # Proxy WebSocket requests to Node.js backend with WSS support
        # 将 WebSocket 请求代理到 Node.js 后端，支持 WSS
        location /ws/ {
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_pass http://127.0.0.1:8088/;
        }
    }
}
EOF

# Create SSL directory and generate self-signed certificate for testing
# 创建 SSL 目录并生成用于测试的自签名证书
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -subj "/CN=localhost" && \
    chmod 600 /etc/nginx/ssl/*

EXPOSE 80 443

# Set low memory environment variables and remove unsupported options
# 设置低内存环境变量，去除不支持的选项

# Run in the foreground and combine commands to reduce the number of processes
# 使用前台运行并合并命令减少进程数
CMD ["sh", "-c", "node --expose-gc --unhandled-rejections=strict /app/server/server.js & nginx -g 'daemon off;'"]