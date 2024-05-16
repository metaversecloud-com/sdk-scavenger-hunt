# This is for production/aws build only

FROM --platform=linux/arm64 node:20.10-alpine3.19
WORKDIR /usr/app
ARG REF
ARG COMMIT_HASH
RUN echo "export REF=$REF" >> commit_info.txt && echo "export COMMIT_HASH=$COMMIT_HASH" >> commit_info.txt
COPY . ./
EXPOSE 3000
CMD ["npm", "start"]
