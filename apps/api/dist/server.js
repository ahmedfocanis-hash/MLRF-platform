import { app } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './config/db.js';
// Only bind to local port when running locally outside of serverless production
if (process.env.NODE_ENV !== 'production') {
    const start = async () => {
        try {
            if (process.env.CONNECT_MONGO === 'true') {
                await connectMongo();
            }
            app.listen(env.PORT, () => {
                console.log(`MLRF API listening on http://localhost:${env.PORT}`);
            });
        }
        catch (error) {
            console.error('Startup failed', error);
            process.exit(1);
        }
    };
    void start();
}
export default app;
export { app };
//# sourceMappingURL=server.js.map