'use strict';
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const SECRET  = process.env.JWT_SECRET || 'softora_secret_2024';

function authMiddleware(req,res,next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({error:'غير مصرح'});
    try { const d=jwt.verify(token,SECRET); req.userId=d.id; next(); }
    catch(e) { res.status(401).json({error:'جلسة منتهية'}); }
}

module.exports = ({loadDB,saveDB}) => {
    router.post('/register', async (req,res) => {
        try {
            const {name,email,password,lang='ar'} = req.body;
            if (!name||!email||!password) return res.status(400).json({error:'جميع الحقول مطلوبة'});
            if (password.length<8) return res.status(400).json({error:'كلمة المرور 8 أحرف على الأقل'});
            const db = loadDB();
            if (db.users.find(u=>u.email===email)) return res.status(400).json({error:'البريد مستخدم مسبقاً'});
            const hash = await bcrypt.hash(password,12);
            const id   = Date.now();
            db.users.push({id,name,email,password:hash,lang,created_at:new Date().toISOString()});
            saveDB(db);
            const token = jwt.sign({id,email},SECRET,{expiresIn:'30d'});
            res.json({ok:true,token,user:{id,name,email,lang}});
        } catch(e) { res.status(500).json({error:'خطأ في الخادم'}); }
    });

    router.post('/login', async (req,res) => {
        try {
            const {email,password} = req.body;
            if (!email||!password) return res.status(400).json({error:'أدخل البريد وكلمة المرور'});
            const db   = loadDB();
            const user = db.users.find(u=>u.email===email);
            if (!user||!(await bcrypt.compare(password,user.password))) return res.status(401).json({error:'بيانات غير صحيحة'});
            const token = jwt.sign({id:user.id,email},SECRET,{expiresIn:'30d'});
            res.json({ok:true,token,user:{id:user.id,name:user.name,email:user.email,lang:user.lang}});
        } catch(e) { res.status(500).json({error:'خطأ في الخادم'}); }
    });

    router.get('/me', authMiddleware, (req,res) => {
        try {
            const db   = loadDB();
            const user = db.users.find(u=>u.id===req.userId);
            if (!user) return res.status(404).json({error:'مستخدم غير موجود'});
            const subs = db.subscriptions?.filter(s=>s.user_id===req.userId)||[];
            res.json({user:{id:user.id,name:user.name,email:user.email,lang:user.lang}, subscriptions:subs});
        } catch(e) { res.status(500).json({error:'خطأ في الخادم'}); }
    });

    return router;
};
