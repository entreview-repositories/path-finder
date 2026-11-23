import { connectDatabase } from './src/infrastructure/database/prisma.js';
import { createRepository } from './src/infrastructure/repositories/prisma.repository.js';
import { createApp } from './src/presentation/http/create-app.js';

const database = connectDatabase();
await database.$queryRaw`SELECT 1`;
const server = createApp(createRepository(database)).listen(
  Number(process.env.PORT ?? 3001),
  '127.0.0.1',
  () => {
    const address = `http://127.0.0.1:${server.address().port}`;
    console.log(`Path Finder API running at ${address}`);
    process.send?.({ address });
  },
);
const stop = () =>
  server.close(async () => {
    await database.$disconnect();
    process.exit(0);
  });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
