FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Using a simple server to serve the build or just running dev for now as per user preferences usually
# For a real deployment we would use Nginx, but for this demo/handoff we'll stick to a node serve or just dev
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
