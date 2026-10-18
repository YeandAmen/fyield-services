import test from 'node:test';
import assert from 'node:assert/strict';
import {isAdmin,otpEnabled} from '../lib/access.js';
test('admin access requires a verified email on the server allowlist',()=>{
 process.env.ADMIN_EMAILS='owner@example.test';
 assert.equal(isAdmin(null),false);
 assert.equal(isAdmin({email:'owner@example.test',emailVerified:false}),false);
 assert.equal(isAdmin({email:'outsider@example.test',emailVerified:true}),false);
 assert.equal(isAdmin({email:'OWNER@example.test',emailVerified:true}),true);
 delete process.env.ADMIN_EMAILS;
 assert.equal(isAdmin({email:'owner@example.test',emailVerified:true}),false);
});
test('OTP stays disabled until both delivery configuration and activation exist',()=>{
 delete process.env.EMAIL_OTP_ENABLED;delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM;
 assert.equal(otpEnabled(),false);process.env.EMAIL_OTP_ENABLED='true';assert.equal(otpEnabled(),false);
 process.env.RESEND_API_KEY='test-only';process.env.EMAIL_FROM='test@example.test';assert.equal(otpEnabled(),true);
});

test('Gmail OTP requires explicit activation and a complete Gmail configuration',()=>{
 const keys=['EMAIL_PROVIDER','GMAIL_USER','GMAIL_APP_PASSWORD','EMAIL_OTP_ENABLED','RESEND_API_KEY','EMAIL_FROM'];
 const original=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{
  process.env.EMAIL_PROVIDER='gmail';process.env.EMAIL_OTP_ENABLED='true';
  delete process.env.GMAIL_USER;delete process.env.GMAIL_APP_PASSWORD;
  assert.equal(otpEnabled(),false);
  process.env.GMAIL_USER='owner@gmail.com';assert.equal(otpEnabled(),false);
  process.env.GMAIL_APP_PASSWORD='abcd efgh ijkl mnop';assert.equal(otpEnabled(),true);
  process.env.GMAIL_USER='owner@example.test';assert.equal(otpEnabled(),false);
  process.env.GMAIL_USER='owner@gmail.com';process.env.EMAIL_OTP_ENABLED='false';assert.equal(otpEnabled(),false);
 }finally{for(const k of keys){if(original[k]===undefined)delete process.env[k];else process.env[k]=original[k]}}
});
