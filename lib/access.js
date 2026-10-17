export function isAdmin(user){
 const allowed=(process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 return Boolean(user?.emailVerified===true && allowed.includes(user.email?.toLowerCase()));
}
export function otpEnabled(){return process.env.EMAIL_OTP_ENABLED==='true' && Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);}
