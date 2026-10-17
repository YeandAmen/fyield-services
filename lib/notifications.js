// Best-effort alerts must not prevent a customer from creating an account.
export async function notifyNewSignup(){
 const recipients=[...new Set((process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean))];
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM||!recipients.length)return;
 try{
  const results=await Promise.all(recipients.map(email=>fetch('https://api.resend.com/emails',{
   method:'POST',signal:AbortSignal.timeout(5000),
   headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:'New signup on Fyield',text:'A new account has joined Fyield. Sign in at https://fyield-services.vercel.app/ and open My account → Admin dashboard to view your community. This is an account signup, not necessarily a published service profile.'})
  })));
  if(results.some(r=>!r.ok))console.warn('Administrator signup notification delivery failed.');
 }catch{console.warn('Administrator signup notification delivery unavailable.');}
}
