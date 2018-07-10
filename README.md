# plugme-server
This is the core server for the PlugMe project.

[![Build Status](https://travis-ci.org/PlugMe-ng/plugme-server.svg?branch=staging)](https://travis-ci.org/PlugMe-ng/plugme-server)
[![Coverage Status](https://coveralls.io/repos/github/PlugMe-ng/plugme-server/badge.svg?branch=staging)](https://coveralls.io/github/PlugMe-ng/plugme-server?branch=staging)
[![codecov](https://codecov.io/gh/PlugMe-ng/plugme-server/branch/staging/graph/badge.svg)](https://codecov.io/gh/PlugMe-ng/plugme-server)
[![Hound CI](https://camo.githubusercontent.com/23ee7a697b291798079e258bbc25434c4fac4f8b/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f50726f7465637465645f62792d486f756e642d6138373364312e737667)](https://houndci.com)

Imagine, a platform where developers (for example) can both share work they’ve done as content, and use those works they’ve shared as portfolio to get new job opportunities. It all starts with developers being able to subscribe to a plan and as such post any amount of content and/or apply to as many job opportunities as they would like (depending on parameters of plans subscribed for) using tags (like `json`, `php`, `python` etc.)

PlugMe seeks to be such a platform.

_More info to follow_

## Technology Stack

To see the technology stack utilized by this project checkout [Technology Stack](https://github.com/PlugMe-ng/plugme-server/wiki/Technology-Stack).

## Setting up the project locally

The project has been configured with some npm scripts entries for setting up and starting the project for development locally.

### Prerequisite
The environment variables (dev and test database urls, jwt authentication secret, etc.) should be included in the `.env` file as listed in  `.env-sample`

```
# Install all dependencies
npm i

# Create the required databases using sequelize
## Development DB
npx sequelize db:create

## Test DB
NODE_ENV=test npx sequelize db:create

# Run migrations
npm run db:migrate
```

### Running Tests
This requires setting up the project as described above
```
# Run tests
npm test
```

## Usage

_Coming soon_

## Testing

_Coming soon_

## API Docs

_Coming soon_

## Contributing

To see how to go about contributing to this project checkout [contributing](contributing.md).

The Pivotal Tracker board for this project can be found [here](https://www.pivotaltracker.com/n/projects/2160096).

## Credits

_Coming soon_

## License

_To be decided_

## FAQ

_Coming soon_
