import 'dotenv/config';
export declare const env: {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    WEB_ORIGIN: string;
    TURSO_DATABASE_URL: string;
    TURSO_AUTH_TOKEN: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    PAYMENT_WEBHOOK_SECRET: string;
    PUBLIC_WEB_URL: string;
    DEMO_MODE: boolean;
    UPLOAD_DIR: string;
};
