FROM nginx

RUN rm /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/

COPY server.company.com.crt /etc/nginx/
COPY server.company.com.key /etc/nginx/
RUN apt-get update && apt-get install -y procps