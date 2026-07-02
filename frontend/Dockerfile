# Container for the React frontend (Vite dev server).
FROM node:20

WORKDIR /app

# install dependencies first so this layer is cached
COPY package.json .
RUN npm install

# copy the rest of the frontend code
COPY . .

# run the dev server
CMD ["npm", "run", "dev"]
