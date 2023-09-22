FROM mcr.microsoft.com/devcontainers/base:jammy

RUN apt update \
    && apt upgrade -y
RUN apt install curl dirmngr apt-transport-https lsb-release ca-certificates -y
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
RUN apt install nodejs -y