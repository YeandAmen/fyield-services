import express from 'express';
import app from './api/index.js';
app.use(express.static('dist'));
const port=Number(process.env.PORT)||4174;
app.listen(port,'127.0.0.1',()=>console.log('Fyield: http://localhost:'+port));
