FROM alpine:latest

RUN apk add --update alpine-sdk autoconf automake libtool && \
    apk add libffi-dev openssl-dev && \
    apk --no-cache --update add build-base && \
    apk add --no-cache --update libwebp-tools ffmpeg yarn nodejs


WORKDIR /app
COPY . .
RUN yarn

CMD ["gif2webp", "-version"]
