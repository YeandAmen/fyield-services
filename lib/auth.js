import { betterAuth } from 'better-auth';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
neonConfig.webSocketConstructor = WebSocket;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 12000 });
let instance;
export function getAuth(){
 if(!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length<32) throw new Error('Authentication is not configured');
 return instance ||= betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || 'https://fyield-services.vercel.app',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'https://fyield-services.vercel.app'],
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
  session: { expiresIn: 60*60*24*7, updateAge: 60*60*24 },
  rateLimit: { enabled:true, storage:'database', window:60, max:80, customRules:{'/sign-up/email':{window:3600,max:5},'/sign-in/email':{window:60,max:8}} },
  advanced: { useSecureCookies: process.env.NODE_ENV === 'production' }
 });
}
