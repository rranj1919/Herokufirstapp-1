var express = require('express');
var router = express.Router();
let jwt = require('jsonwebtoken');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
 
 /* Post users Login. */
 router.post('/login', function (req, res, next) {
  console.log('req'+JSON.stringify(req.body)); 
  let userdata = {
  username: req.body.username,
  password: req.body.password
  };
  console.log('username'+process.env.USERNAME ; 
  console.log('password'+process.env.PASSWORD);
  //Go to server for user varificarion
  if (userdata.username == process.env.USERNAME  && userdata.password == process.env.PASSWORD) { 

    let token = jwt.sign(userdata, global.config.secretKey, {
      algorithm: global.config.algorithm,
      expiresIn: '10m'
      });
  res.status(200).json({
  message: 'Login Successful',
  jwtoken: token
  });
  }
  else {
  res.status(401).json({
  message: 'Login Failed'+userdata.username+userdata.password
  });
  }
  });
  module.exports = router;