import {sendEmail} from './email.js';
import {emailReady} from './mail-config.js';
// Delivery failures must not prevent account creation or sign-in.
async function notifyAdmin(event){
 const recipients=[...new Set((process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean))];
 if(!emailReady()||!recipients.length)return;
 try{
  const results=await Promise.allSettled(recipients.map(to=>sendEmail({
   to,subject:event==='signin'?'New sign-in on Fyield':'New signup on Fyield',
   text:(event==='signin'?'An account successfully signed in to Fyield.':'A new account has joined Fyield. This is an account signup, not necessarily a published service profile.')+' Open https://fyield-services.vercel.app/#admin to view your community.'
  })));
  if(results.some(r=>r.status==='rejected'))console.warn('Administrator notification delivery failed.');
 }catch{console.warn('Administrator notification delivery unavailable.');}
}
export const notifyNewSignup=()=>notifyAdmin('signup');
export const notifySignIn=()=>notifyAdmin('signin');
