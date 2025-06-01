# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server code (including Komodo binaries)
COPY . .

# Make Komodo Linux binary executable (adjust path if needed)
RUN chmod +x ./engines/komodo/Linux/komodo-14.1-linux || true

# Expose the port your server runs on
EXPOSE 5001

# Start the server
CMD ["npm", "start"] 