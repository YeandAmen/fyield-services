import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';import fs from 'node:fs';import sharp from 'sharp';import {pool} from '../lib/auth.js';import {del} from '@vercel/blob';
const base=process.env.TEST_BASE_URL||'http://localhost:4175',run=Date.now();const emails=[`fyield-qa-provider-${run}@example.test`,`fyield-qa-customer-${run}@example.test`];let photoUrl;
async function request(path,{cookie,body,method='GET',origin=base}={}){const r=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});let data;try{data=await r.json()}catch{throw Error('Non-JSON response '+path+' '+r.status)}return {status:r.status,data,cookie:r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};}
try{
 const signup=async(email,name)=>{const r=await request('/auth/sign-up/email',{method:'POST',body:{email,name,password:randomBytes(24).toString('base64')}});assert.equal(r.status,200,JSON.stringify(r.data));assert.ok(r.cookie);return r.cookie};
 const a=await signup(emails[0],'Fyield QA provider'),b=await signup(emails[1],'Fyield QA customer');console.log('PASS: account creation and secure session flow');
 const valid={name:'Fyield QA temporary listing',title:'Quality assurance test listing',category:'Cleaning',area:'Wuse',price:5000,unit:'visit',skills:['Deep cleaning','Move-in cleaning'],experience:2,about:'Temporary automated test listing. It will be removed when the test finishes.',photos:[],consent:true};
 assert.equal((await request('/providers',{method:'POST',body:valid})).status,401);
 assert.equal((await request('/providers',{cookie:a,method:'POST',body:valid,origin:'https://untrusted.example'})).status,403);
 assert.equal((await request('/providers',{cookie:a,method:'POST',body:{...valid,area:'Lagos'}})).status,400);console.log('PASS: authentication, origin and input validation');
 const img=await sharp(fs.readFileSync('dist/assets/photo-1600210492486-724fe5c67fb0.jpg')).resize(500).jpeg().toBuffer();
 const uploaded=await request('/photos',{cookie:a,method:'POST',body:{image:'data:image/jpeg;base64,'+img.toString('base64'),consent:true}});assert.equal(uploaded.status,201,JSON.stringify(uploaded.data));photoUrl=uploaded.data.photo.url;
 const owned={...valid,photos:[{id:uploaded.data.photo.id,caption:'Temporary test photo of interior cleaning.'}]};
 assert.equal((await request('/providers',{cookie:b,method:'POST',body:owned})).status,403);
 const created=await request('/providers',{cookie:a,method:'POST',body:owned});assert.equal(created.status,200,JSON.stringify(created.data));const id=created.data.profile.id;assert.equal(created.data.profile.photos.length,1);console.log('PASS: image processing, persisted gallery and photo ownership');
 const review={rating:5,comment:'This is temporary quality assurance feedback and will be removed.',confirmed:true};
 assert.equal((await request('/providers/'+id+'/reviews',{cookie:a,method:'POST',body:review})).status,403);
 assert.equal((await request('/providers/'+id+'/reviews',{cookie:b,method:'POST',body:review})).status,201);
 assert.equal((await request('/providers/'+id+'/reviews',{cookie:b,method:'POST',body:review})).status,409);
 const r=await request('/providers/'+id+'/reviews');assert.equal(r.data.reviews.length,1);assert.equal((await request('/reviews/'+r.data.reviews[0].id,{cookie:a,method:'DELETE',body:{}})).status,404);
 assert.equal((await request('/providers/'+id)).data.profile.rating,5);console.log('PASS: no self reviews, no duplicate reviews, protected deletion and real rating aggregation');
 assert.equal((await request('/providers/'+id+'/enquiries',{cookie:b,method:'POST',body:{message:'Temporary QA enquiry about a home cleaning service.'}})).status,201);
 const inbox=await request('/enquiries',{cookie:a});const enquiry=inbox.data.enquiries[0];assert.equal(enquiry.canReply,true);
 assert.equal((await request('/enquiries/'+enquiry.id+'/reply',{cookie:b,method:'POST',body:{reply:'Trying to reply as the wrong account.'}})).status,404);
 assert.equal((await request('/enquiries/'+enquiry.id+'/reply',{cookie:a,method:'POST',body:{reply:'Thank you. This is a temporary QA reply.'}})).status,200);console.log('PASS: private enquiry access and provider-only replies');
 assert.equal((await request('/photos/'+uploaded.data.photo.id,{cookie:b,method:'DELETE',body:{}})).status,404);
 console.log('ALL END-TO-END API CHECKS PASSED');
}finally{
 if(photoUrl)await del(photoUrl);
 await pool.query('DELETE FROM "user" WHERE email=ANY($1::text[])',[emails]);await pool.end();console.log('Temporary QA accounts and records removed.');
}
