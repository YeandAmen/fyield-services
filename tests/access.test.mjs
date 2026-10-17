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
