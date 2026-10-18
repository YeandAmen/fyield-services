export function emailProvider(){return process.env.EMAIL_PROVIDER || 'resend';}
export function gmailPassword(){return (process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');}
export function emailReady(){
 if(emailProvider()==='gmail')return /^[^\s@]+@gmail\.com$/i.test(process.env.GMAIL_USER||'') && gmailPassword().length===16;
 return emailProvider()==='resend' && Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
