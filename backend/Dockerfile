FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:20.8.0
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm","start"]
