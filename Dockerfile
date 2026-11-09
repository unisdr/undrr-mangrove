FROM node:26-bookworm

# Prevent the container from asking for user input during installation
ENV DEBIAN_FRONTEND=noninteractive

# Update & Upgrade the system and install necessary packages
RUN apt-get update && apt-get upgrade -y

# Install necessary tools and software-properties-common
RUN apt-get install -y wget software-properties-common curl joe iputils-ping git

# Node 26 does not bundle Corepack; install it before enabling Yarn.
RUN npm install --global corepack@0.36.0 && corepack enable
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
# CMD ["yarn", "run", "storybook"]
