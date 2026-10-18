// Best-effort alerts must not prevent a customer from creating an account.
async function notifyAdmin(event){
 const recipients=[...new Set((process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean))];
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM||!recipients.length)return;
 try{
  const results=await Promise.all(recipients.map(email=>fetch('https://api.resend.com/emails',{
   method:'POST',signal:AbortSignal.timeout(5000),
   headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:event==='signin'?'New sign-in on Fyield':'New signup on Fyield',text:(event==='signin'?'An account successfully signed in to Fyield.':'A new account has joined Fyield. This is an account signup, not necessarily a published service profile.')+' Open https://fyield-services.vercel.app/#admin to view your community.'})
  })));
  if(results.some(r=>!r.ok))console.warn('Administrator signup notification delivery failed.');
 }catch{console.warn('Administrator signup notification delivery unavailable.');}
}

export const notifyNewSignup=()=>notifyAdmin('signup');
export const notifySignIn=()=>notifyAdmin('signin');
