import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { otpEnabled } from './access.js';
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
  emailAndPassword: { enabled: !otpEnabled(), minPasswordLength: 12, maxPasswordLength: 128 },
  plugins: otpEnabled() ? [emailOTP({
   otpLength:6, expiresIn:300, allowedAttempts:3, storeOTP:'hashed',
   rateLimit:{window:60,max:3},
   async sendVerificationOTP({email,otp}){
    const response=await fetch('https://api.resend.com/emails',{
     method:'POST',signal:AbortSignal.timeout(10000),
     headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
     body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:'Your Fyield verification code',text:`Your Fyield code is ${otp}. It expires in 5 minutes. Never share this code. If you did not request it, ignore this email.`})
    });
    if(!response.ok)throw new Error('Email delivery is temporarily unavailable.');
   }
  })] : [],
  session: { expiresIn: 60*60*24*7, updateAge: 60*60*24 },
  rateLimit: { enabled:true, storage:'database', window:60, max:80, customRules:{'/sign-up/email':{window:3600,max:5},'/sign-in/email':{window:60,max:8}} },
  advanced: { useSecureCookies: process.env.NODE_ENV === 'production' }
 });
}
