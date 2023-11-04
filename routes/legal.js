const express = require('express'),
      router = express.Router();
      
router.get('/tos', (req, res)=>{
  res.render('tos', {title:'Terms of Service.', css_js:'legal'});
});
router.get('/privacy', (req, res)=>{
  res.render('privacy', {title:'Privacy Policy.', css_js:'legal'});
});
      
module.exports = router;