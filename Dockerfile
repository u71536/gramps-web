FROM dmstraub/gramps-webapi:latest
COPY dist /app/static
LABEL org.opencontainers.image.source="https://github.com/u71536/gramps-web"
LABEL org.opencontainers.image.description="Gramps Web New - Modified version"
