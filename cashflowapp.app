cat  /etc/nginx/sites-available/cashflowapp.app
server {
    server_name cashflowapp.app www.cashflowapp.app;

    # Logging
    access_log /var/log/nginx/cashflowapp.app.access.log;
    error_log /var/log/nginx/cashflowapp.app.error.log warn;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location ~* ^/api/ {
        proxy_pass http://localhost:5010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        client_max_body_size 20M;
    }

    # Main application (React frontend)
    location / {
        proxy_pass http://localhost:5008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        client_max_body_size 20M;
    }

    listen 443 ssl http2 ; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/cashflowapp.app/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/cashflowapp.app/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}
server {
    if ($host = www.cashflowapp.app) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = cashflowapp.app) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name cashflowapp.app www.cashflowapp.app;
    return 404; # managed by Certbot




}
