import { app } from './app.js';
import { env } from './config/env.js';
import { initDb } from './config/db.js';

// Only bind to local port when running locally outside of serverless production
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    try {
      if (process.env.TURSO_DATABASE_URL || process.env.CONNECT_TURSO === 'true' || process.env.CONNECT_MONGO === 'true') {
        await initDb();
      }
      app.listen(env.PORT, () => {
        console.log(`MLRF API listening on http://localhost:${env.PORT}`);
      });
    } catch (error) {
      console.error('Startup failed', error);
      process.exit(1);
    }
  };
  void start();
}

export default app;
export { app };
