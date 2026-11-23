# Path Finder

Electron and Express demonstration of shortest-path search with ordered waypoints, SQLite persistence and a layered JavaScript architecture.

## Requirements

- Node.js 24 or newer and npm.
- A graphical desktop session for Electron.

## Install and run

From the repository root:

```text
npm ci
npm run setup
npm run desktop
```

The setup command generates the Prisma client and applies SQLite migrations. Local data is stored under data/ and is excluded from Git. The desktop command starts its API and opens the application window.

To run the web interface and API without Electron:

```text
npm start
```

Open http://localhost:3001. Stop the process with Ctrl+C.

## Use

Create a sample workspace or select a saved map. Place a start, a destination and at least one waypoint. Find and save the shortest route. Waypoint numbers determine their visiting order. Maps, preferences and saved routes persist in SQLite.

## Verification

```text
npm test
npm run test:desktop
npm run format:check
```

The desktop smoke test requires a graphical desktop session. npm run format applies the formatting configuration. Documentation and screenshots are in docs/.

## Organization

src/domain/ contains the search and validation logic; src/application/ coordinates use cases; src/infrastructure/ provides persistence and workers; src/presentation/ exposes HTTP routes and middleware. The user interface is under ui/.
