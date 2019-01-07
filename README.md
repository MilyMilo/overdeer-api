# Overdeer - the friendly school overseer

[![Greenkeeper badge](https://badges.greenkeeper.io/Scr1ptK1tt13s/overdeer-api.svg)](https://greenkeeper.io/)

> Back-end API implementation

**Under heavy development! Expect breaking changes without notice!**

### NPM scripts reference

Before running any commands make sure to install dependencies with `npm install`

Also **Make sure the DB is up and running**, and you have entered created your `config/dev.js`

#### To run app in development mode:

- `npm run dev`

#### To run tests

- `npm run test:unit`

#### To lint and fix your code

> This should happen automatically before any commit

- `npm run lint:fix`

#### To serve docs

- `npm run docs:watch`

#### To bundle docs into html

- `npm run docs:build`

#### To run app in production mode

> **This is not production ready just yet**

- `npm run start`

### Cool docker tricks

#### To run MongoDB

> This will make your DB accessible at `mongodb://localhost:27017` without authentication

- `docker run -d --name overdeer-db -p 27017:27017 mongo:4.1.6`

#### To use our docker-compose

> This will create an auto-reloading container with the app, mongodb instance and mongo-admin at localhost:5555

- `docker-compose up`

##### To clean up you can do

- `docker-compose down`

### To forcibly remove containers with status `Exited`

- `docker ps -a | grep Exited | awk '{print $1}' | docker rm -f`
