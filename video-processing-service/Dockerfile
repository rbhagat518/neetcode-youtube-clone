# Use an offical Node runtime as a parent image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# copy package.json and package-lock.json into the working directory
# this helps to provide the dependenices and scripts needed to run the app
COPY package*.json ./

# install ffmpeg in the container
# we can do this RUN command which runs linux commands on a MACOS system because
# node:18 environment is Debian based (I think)
RUN apt-get update && apt-get install -y ffmpeg

# Install any needed packages specified in package.json
# we can only do this after we copied over the package.json as it contains the dependencies we need to install
RUN npm install

# Copy app
COPY . .

# make port 3000 available outside of this container
EXPOSE 3000

# define the command to run your app using CMD (only one CMD is allowed)
CMD ["npm", "start"]
