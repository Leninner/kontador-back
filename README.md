# Kontador Backend

A backend for the Kontador app.

## Description

## Prerequisites

- Node.js (v20 or higher)
- npm (v10 or higher)
- Docker and Docker Compose

## Project setup

### 1. Clone the repository

```bash
$ git clone https://github.com/your-username/kontador.git
$ cd kontador/back
```

### 2. Environment configuration

```bash
$ cp .env.example .env
```

### 3. Start the database

```bash
$ docker compose up -d
```

### 4. Install dependencies

```bash
$ npm install
```

### 5. Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
