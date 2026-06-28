'use strict';
const router = require('express').Router();
const PRODUCTS = [{
    id:'sfm', name_ar:'مدير الملفات الآمن', name_en:'Secure File Manager',
    desc_ar:'برنامج متطور لتشفير وإدارة ملفاتك بأمان تام على جهازك',
    desc_en:'Advanced software to encrypt and manage your files with complete security',
    category:'desktop', platform:'windows', version:'1.0.0', icon:'🔒', active:1
}];
module.exports = () => {
    router.get('/', (req,res) => res.json(PRODUCTS));
    router.get('/:id', (req,res) => res.json(PRODUCTS.find(p=>p.id===req.params.id)||{}));
    return router;
};
