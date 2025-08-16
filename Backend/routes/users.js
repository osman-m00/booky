const express = require('express');
const router = express.Router();

router.get('/profile', (req, res)=>{
    res.json({message: 'profile endpoint from user works!'});
});

module.exports = router;