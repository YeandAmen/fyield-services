import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
test('no personal-data forms or remote image/font/script dependencies',()=>{
 assert.doesNotMatch(html,/<(?:input|textarea)[^>]*name=["'](?:name|email|phone|message|address)/i);
 assert.doesNotMatch(js,/enquiryForm|listingForm|new FormData|fetch\(|XMLHttpRequest/);
 assert.doesNotMatch(html+js,/https:\/\/(?:images\.unsplash\.com|fonts\.googleapis\.com)/);
 assert.doesNotMatch(js,/persist\('fyield-(?:enquiries|listings)'/);
});
test('every provider and neighborhood is in Abuja',()=>{
 const prefix=js.slice(0,js.indexOf('const read='));
 const profiles=vm.runInNewContext(prefix+'; profiles');
 assert.equal(profiles.length,5);
 assert.ok(profiles.every(p=>p.location==='Abuja'));
 for(const p of profiles)assert.ok(html.includes(`<option>${p.area}</option>`));
 assert.doesNotMatch(html+js,/Lagos|Port Harcourt|Lekki|Ikeja|Yaba/);
});
test('untrusted text is escaped before interpolation',()=>{
 const source=js.slice(js.indexOf('const esc='),js.indexOf(';let toastTimer'));
 const escape=vm.runInNewContext(source+';esc');
 assert.equal(escape('<img src=x onerror="alert(1)">&\''),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
});
test('deployment blocks embedding, submission and unexpected connections',()=>{
 const h=Object.fromEntries(config.headers[0].headers.map(x=>[x.key,x.value]));
 assert.equal(config.outputDirectory,'dist');
 for(const directive of ["default-src 'none'","connect-src 'none'","form-action 'none'","frame-ancestors 'none'","script-src 'self'"])assert.ok(h['Content-Security-Policy'].includes(directive));
 assert.equal(h['X-Content-Type-Options'],'nosniff');
 assert.equal(h['Referrer-Policy'],'no-referrer');
});
test('bundle contains no recognizable embedded credentials',()=>{
 assert.doesNotMatch(html+js+JSON.stringify(config),/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|Bearer\s+[A-Za-z0-9._-]{20,}/);
});
