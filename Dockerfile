# Build the Angular app and serve the static output via nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The wiki index + article content are served by the backend; just build the SPA.
RUN npm run build

FROM nginx:alpine
# Angular's application builder outputs to dist/<project>/browser
COPY --from=build /app/dist/*/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
