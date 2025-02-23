# Use an official Node.js image
FROM node:23-alpine3.20
# Set the working directory inside the container.
WORKDIR /app

# Copy dependency definitions.
COPY package.json ./

# Install dependencies.
RUN npm install

# Copy the rest of the application code.
COPY . .

# Expose the port the app runs on.
EXPOSE 3000

# Run the app in development mode.
CMD ["npm", "start"]
