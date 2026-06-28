'use strict';
const router = require('express').Router();
module.exports = ({loadDB,saveDB}) => {
    router.post('/', (req,res) => {
        const {name,email,subject,message} = req.body;
        if (!name||!email||!message) return res.status(400).json({error:'جميع الحقول مطلوبة'});
        const db = loadDB();
        if (!db.contacts) db.contacts = [];
        db.contacts.push({name,email,subject:subject||'',message,created_at:new Date().toISOString()});
        saveDB(db);
        res.json({ok:true});
    });
    return router;
};
