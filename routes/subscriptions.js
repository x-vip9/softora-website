'use strict';
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
function auth(req,res,next) {
    const token=req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({error:'غير مصرح'});
    try { const d=jwt.verify(token,process.env.JWT_SECRET||'softora_secret_2024'); req.userId=d.id; next(); }
    catch(e) { res.status(401).json({error:'جلسة منتهية'}); }
}
module.exports = ({loadDB}) => {
    router.get('/', auth, (req,res) => {
        const db = loadDB();
        res.json(db.subscriptions?.filter(s=>s.user_id===req.userId)||[]);
    });
    return router;
};
