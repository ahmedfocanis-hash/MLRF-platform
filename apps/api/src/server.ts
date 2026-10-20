import mongoose from 'mongoose';
import {app} from './app.js';
import {env} from './config/env.js';
async function start(){try{if(process.env.CONNECT_MONGO==='true')await mongoose.connect(env.MONGODB_URI);app.listen(env.PORT,()=>console.info(`MLRF API listening on http://localhost:${env.PORT}`));}catch(error){console.error('Startup failed',error);process.exit(1)}}
void start();
