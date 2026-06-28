'use strict';
require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const compression = require('compression');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const fs          = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// ── قاعدة بيانات JSON بسيطة ──
function loadDB() {
    try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); }
    catch(e) { return {users:[], subscriptions:[], contacts:[]}; }
}
function saveDB(data) {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); } catch(e) {}
}

// ── Middleware ──
app.use(helmet({contentSecurityPolicy:false}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

const limiter     = rateLimit({windowMs:15*60*1000, max:100, standardHeaders:true, legacyHeaders:false});
const authLimiter = rateLimit({windowMs:15*60*1000, max:10,  standardHeaders:true, legacyHeaders:false});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── Routes ──
app.use('/api/auth',          require('./routes/auth')({loadDB,saveDB}));
app.use('/api/products',      require('./routes/products')());
app.use('/api/subscriptions', require('./routes/subscriptions')({loadDB}));
app.use('/api/contact',       require('./routes/contact')({loadDB,saveDB}));

// ── SPA ──
app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, () => console.log(`Softora running on port ${PORT}`));
