FROM node:bookworm

# Prevent the container from asking for user input during installation
ENV DEBIAN_FRONTEND=noninteractive

# Update & Upgrade the system and install necessary packages
RUN apt-get update && apt-get upgrade -y

# Install necessary tools and software-properties-common
RUN apt-get install -y wget software-properties-common curl joe iputils-ping git

# Set yarn to stable version
RUN corepack disable
RUN npm install -g yarn --force
RUN yarn set version stable
RUN corepack enable
RUN yarn -v

# Create app directory
WORKDIR /data/storybook

# Make storybook port available available
EXPOSE 6006

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Run Storybook local dev server
CMD ["yarn", "run", "storybook"]