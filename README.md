# NestJS Framework Boilerplate (MongoDB)

[![CI/CD](https://github.com/dominicarrojado/nestjs-mongodb-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/dominicarrojado/nestjs-mongodb-boilerplate/actions/workflows/ci.yml)

A local development setup or boilerplate for [Nest.js framework](https://nestjs.com/) with [MongoDB](https://www.mongodb.com/) and [mongo-express](https://github.com/mongo-express/mongo-express) using [Docker Compose](https://docs.docker.com/compose/).

## Quick Start

1. Install [Node.js](https://nodejs.org/en/download/) - _for IDE type checking_.
2. Install [Yarn](https://yarnpkg.com/lang/en/docs/install/) - _for IDE type checking_.
3. Install [Docker Compose](https://docs.docker.com/compose/install/) and make sure it is running in the system background.
4. Clone the app:

```bash
git clone git@github.com:dominicarrojado/nestjs-mongodb-boilerplate.git
```

5. Install npm packages - _for IDE type checking_.

```bash
cd nestjs-mongodb-boilerplate
yarn install --frozen-lockfile
```

6. Add file environment variables. For development it should have name `stage.dev.env`, where:

- PORT - application port. (Example: 3000)
- DB_URL - mongoDb url starting with `mongodb+srv://` (in case of Mongo Cloud) or `mongodb://` (in case of Mongo). (Example: mongodb+srv://login:password@hostname/dbName?retryWrites=true&w=majority&appName=Cluster0)
- BOT_TOKEN - bot token given to you by BotFather. For more info please follow the [tutorial](https://core.telegram.org/bots/tutorial)
- BOT_NAME - bot name from the [tutorial](https://core.telegram.org/bots/tutorial). The name after `@` symbol. (Example: for `@test_bot` we need to use `test_bot`)
- WEB_APP_NAME - bot web app name from the [tutorial](https://core.telegram.org/bots/tutorial).
- THRESHOLD_FOR_POINTS - put `1` here.
- MNEMONIC - mnemonic from TON
- AUTH_DATE_SEC_TIMEOUT - put `1800`
- POINTS_REWARD - put `5`
- SERVER_ORIGIN - tonalty backend. For example: https://tonalty.localhost.direct:3000/

7. Build and run the Docker image.

```bash
yarn docker-compose:dev
```

8. Access the app at http://localhost:3000.
9. Make file changes and it will automatically rebuild the app.

## Running All Tests

```bash
yarn docker-compose:test
```

## Running All Tests (with coverage)

```bash
yarn docker-compose:test:cov
```

## Running Tests (Watch)

1. Build and run the Docker image.

```bash
yarn docker-compose:test:watch
```

2. Make file changes and it will automatically rerun tests related to changed files.

## Build For Production

```bash
yarn docker-compose:prod
```

## VSCode Extensions

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Learn

Learn how to build this setup or boilerplate [here](https://dominicarrojado.com/posts/local-development-setup-for-nestjs-projects-with-mongodb/).
