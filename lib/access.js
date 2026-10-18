import {emailReady} from './mail-config.js';
export function isAdmin(user){
 const allowed=(process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 return Boolean(user?.emailVerified===true && allowed.includes(user.email?.toLowerCase()));
}
export function otpEnabled(){return process.env.EMAIL_OTP_ENABLED==='true' && emailReady();}
