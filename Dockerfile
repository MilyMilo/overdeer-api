# This Dockerfile is intended for development purposes only.
# Production dockerfile coming soon...
FROM node:11.6-alpine

LABEL maintainer Milosz Skaza <milymilo@scriptkitties.space>

WORKDIR /app
COPY . .

RUN apk --update add git openssh && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

RUN npm install

EXPOSE 8080

ENTRYPOINT [ "npm", "run" ]
CMD ["dev"]
