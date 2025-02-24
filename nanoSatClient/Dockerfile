# Use an official Node.js image
FROM node:23-alpine3.20
# Set the working directory inside the container.
WORKDIR /app

# Copy dependency definitions.
COPY package.json ./
# COPY package-lock.json ./

# Install dependencies.
RUN npm install
RUN npm install three
RUN npm install --save-dev @types/three
RUN npm install three-orbitcontrols 

# Copy the rest of the application code.
COPY . .


# Build the production version of the app.
RUN npm run build

# Expose the port the app runs on.
EXPOSE 3000

# Run the app in development mode.
CMD ["npm", "start"]
