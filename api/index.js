import express from 'express';
import { randomUUID } from 'node:crypto';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import sharp from 'sharp';
import { put, del } from '@vercel/blob';
import {getAuth,pool} from '../lib/auth.js';
import {InputError,profileInput,reviewInput,text} from '../lib/validation.js';
const app=express();app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.all('/api/auth/*splat',(req,res)=>toNodeHandler(getAuth())(req,res));
app.use(express.json({limit:'2mb'}));
app.use('/api',async(req,res,next)=>{
 try{
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
   const origin=process.env.BETTER_AUTH_URL||'https://fyield-services.vercel.app';
   if(req.headers.origin!==origin)throw new InputError('This request must come from Fyield.',403);
   if(!req.is('application/json'))throw new InputError('JSON request required.',415);
  }
  req.session=await getAuth().api.getSession({headers:fromNodeHeaders(req.headers)});next();
 }catch(e){next(e)}
});
function signed(req){if(!req.session)throw new InputError('Please sign in to continue.',401);return req.session.user.id;}
async function limit(key,max,seconds=86400){
 const r=await pool.query(`INSERT INTO write_limits(key,count,expires_at) VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN write_limits.expires_at<now() THEN 1 ELSE write_limits.count+1 END, expires_at=CASE WHEN write_limits.expires_at<now() THEN now()+$2*interval '1 second' ELSE write_limits.expires_at END RETURNING count`,[key,seconds]);
 if(r.rows[0].count>max)throw new InputError('Too many attempts. Please try again later.',429);
}
const uuid=id=>{if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||''))throw new InputError('Profile not found.',404);return id;};
async function publicProfile(row,viewer){
 const ids=(row.details.photos||[]).map(p=>p.id);
 const photos=ids.length?(await pool.query('SELECT id,url FROM portfolio_photos WHERE user_id=$1 AND id=ANY($2::uuid[])',[row.user_id,ids])).rows:[];
 const stats=(await pool.query('SELECT count(*)::int AS count, round(avg(rating),1)::float AS average FROM customer_reviews WHERE profile_id=$1',[row.id])).rows[0];
 return {...row.details,id:row.id,photos:row.details.photos.map(p=>({...p,url:photos.find(i=>i.id===p.id)?.url})).filter(p=>p.url),isOwn:viewer===row.user_id,reviewCount:stats.count,rating:stats.average,createdAt:row.created_at};
}
app.get('/api/session',(req,res)=>res.json({user:req.session?{id:req.session.user.id,name:req.session.user.name,email:req.session.user.email}:null}));
app.get('/api/providers',async(req,res)=>{const r=await pool.query('SELECT * FROM provider_profiles ORDER BY updated_at DESC LIMIT 100');res.json({profiles:await Promise.all(r.rows.map(p=>publicProfile(p,req.session?.user.id)))});});
app.get('/api/providers/:id',async(req,res)=>{const r=await pool.query('SELECT * FROM provider_profiles WHERE id=$1',[uuid(req.params.id)]);if(!r.rowCount)throw new InputError('Profile not found.',404);res.json({profile:await publicProfile(r.rows[0],req.session?.user.id)});});
app.get('/api/my-profile',async(req,res)=>{const id=signed(req),r=await pool.query('SELECT * FROM provider_profiles WHERE user_id=$1',[id]);res.json({profile:r.rowCount?await publicProfile(r.rows[0],id):null});});
app.post('/api/providers',async(req,res)=>{
 const user=signed(req),details=profileInput(req.body);await limit('profile:'+user,40);
 if(details.photos.length){const own=await pool.query('SELECT id FROM portfolio_photos WHERE user_id=$1 AND id=ANY($2::uuid[])',[user,details.photos.map(p=>p.id)]);if(own.rowCount!==details.photos.length)throw new InputError('You can only publish your own uploaded photos.',403);}
 const r=await pool.query('INSERT INTO provider_profiles(id,user_id,details) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET details=EXCLUDED.details,updated_at=now() RETURNING *',[randomUUID(),user,details]);res.json({profile:await publicProfile(r.rows[0],user)});
});
app.delete('/api/providers/me',async(req,res)=>{const user=signed(req);await pool.query('DELETE FROM provider_profiles WHERE user_id=$1',[user]);res.json({ok:true});});
app.get('/api/my-photos',async(req,res)=>{const r=await pool.query('SELECT id,url FROM portfolio_photos WHERE user_id=$1 ORDER BY created_at DESC LIMIT 24',[signed(req)]);res.json({photos:r.rows});});
app.post('/api/photos',async(req,res)=>{
 const user=signed(req);await limit('photo:'+user,24);
 const count=await pool.query('SELECT count(*)::int AS count FROM portfolio_photos WHERE user_id=$1',[user]);if(count.rows[0].count>=24)throw new InputError('Remove unused photos before uploading more.');
 if(req.body.consent!==true)throw new InputError('Confirm that you have permission to publish this image.');
 const raw=req.body.image;if(typeof raw!=='string'||raw.length>1800000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(raw))throw new InputError('Choose a JPG, PNG, or WebP image under 1.2 MB.');
 let image;try{image=await sharp(Buffer.from(raw.split(',')[1],'base64'),{limitInputPixels:20000000,animated:false}).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).jpeg({quality:80}).toBuffer();}catch{throw new InputError('This image could not be read. Please choose another JPG, PNG, or WebP.');}
 const id=randomUUID();const blob=await put(`portfolio/${user}/${id}.jpg`,image,{access:'public',contentType:'image/jpeg',addRandomSuffix:true});
 try{await pool.query('INSERT INTO portfolio_photos(id,user_id,url) VALUES($1,$2,$3)',[id,user,blob.url]);}catch(e){await del(blob.url);throw e;}
 res.status(201).json({photo:{id,url:blob.url}});
});
app.delete('/api/photos/:id',async(req,res)=>{
 const user=signed(req),id=uuid(req.params.id);
 const used=await pool.query(`SELECT id FROM provider_profiles WHERE user_id=$1 AND details->'photos' @> $2::jsonb`,[user,JSON.stringify([{id}])]);if(used.rowCount)throw new InputError('Remove this photo from your profile and save before deleting it.');
 const r=await pool.query('SELECT url FROM portfolio_photos WHERE id=$1 AND user_id=$2',[id,user]);if(!r.rowCount)throw new InputError('Photo not found.',404);await del(r.rows[0].url);await pool.query('DELETE FROM portfolio_photos WHERE id=$1 AND user_id=$2',[id,user]);res.json({ok:true});
});
app.get('/api/providers/:id/reviews',async(req,res)=>{
 const id=uuid(req.params.id);const r=await pool.query('SELECT r.id,r.rating,r.comment,r.created_at,u.name,r.user_id FROM customer_reviews r JOIN "user" u ON u.id=r.user_id WHERE r.profile_id=$1 ORDER BY r.created_at DESC LIMIT 100',[id]);
 res.json({reviews:r.rows.map(r=>({id:r.id,rating:r.rating,comment:r.comment,createdAt:r.created_at,name:r.name,isOwn:r.user_id===req.session?.user.id}))});
});
app.post('/api/providers/:id/reviews',async(req,res)=>{
 const user=signed(req),id=uuid(req.params.id),v=reviewInput(req.body);await limit('review:'+user,10);
 const p=await pool.query('SELECT user_id FROM provider_profiles WHERE id=$1',[id]);if(!p.rowCount)throw new InputError('Profile not found.',404);if(p.rows[0].user_id===user)throw new InputError('You cannot review your own service.',403);
 try{await pool.query('INSERT INTO customer_reviews(id,profile_id,user_id,rating,comment) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,user,v.rating,v.comment]);}catch(e){if(e.code==='23505')throw new InputError('You have already reviewed this provider.',409);throw e;}res.status(201).json({ok:true});
});
app.delete('/api/reviews/:id',async(req,res)=>{const r=await pool.query('DELETE FROM customer_reviews WHERE id=$1 AND user_id=$2',[uuid(req.params.id),signed(req)]);if(!r.rowCount)throw new InputError('Review not found.',404);res.json({ok:true});});
app.post('/api/providers/:id/enquiries',async(req,res)=>{
 const user=signed(req),id=uuid(req.params.id),message=text(req.body.message,'Message',20,1500);await limit('enquiry:'+user,10);
 const p=await pool.query('SELECT user_id FROM provider_profiles WHERE id=$1',[id]);if(!p.rowCount)throw new InputError('Profile not found.',404);if(p.rows[0].user_id===user)throw new InputError('This is your own profile.');
 await pool.query('INSERT INTO service_enquiries(id,profile_id,customer_id,message) VALUES($1,$2,$3,$4)',[randomUUID(),id,user,message]);res.status(201).json({ok:true});
});
app.get('/api/enquiries',async(req,res)=>{
 const user=signed(req);const r=await pool.query(`SELECT e.*,p.details->>'name' AS provider_name,u.name AS customer_name,p.user_id AS provider_user FROM service_enquiries e JOIN provider_profiles p ON p.id=e.profile_id JOIN "user" u ON u.id=e.customer_id WHERE e.customer_id=$1 OR p.user_id=$1 ORDER BY e.created_at DESC LIMIT 50`,[user]);
 res.json({enquiries:r.rows.map(r=>({id:r.id,message:r.message,reply:r.reply,createdAt:r.created_at,providerName:r.provider_name,customerName:r.customer_name,canReply:r.provider_user===user}))});
});
app.post('/api/enquiries/:id/reply',async(req,res)=>{
 const user=signed(req),reply=text(req.body.reply,'Reply',10,1500);await limit('reply:'+user,30);
 const r=await pool.query('UPDATE service_enquiries e SET reply=$1,replied_at=now() FROM provider_profiles p WHERE e.id=$2 AND e.profile_id=p.id AND p.user_id=$3 RETURNING e.id',[reply,uuid(req.params.id),user]);if(!r.rowCount)throw new InputError('Enquiry not found.',404);res.json({ok:true});
});
app.use('/api',(req,res)=>res.status(404).json({error:'Not found.'}));
app.use((err,req,res,next)=>{const status=err.status||500;if(status===500)console.error('Marketplace request failed',err.code||err.name);res.status(status).json({error:status===500?'Something went wrong. Your changes were not confirmed. Please try again.':err.message});});
export default app;
