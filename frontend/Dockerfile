FROM public.ecr.aws/docker/library/node:20.8.0
COPY . .
RUN npm install
RUN npm run build
CMD ["cp", "-r", "/build/.", "/asset-output/"]

