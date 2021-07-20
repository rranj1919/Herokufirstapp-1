var express = require('express');
var router = express.Router();
let jwt = require('jsonwebtoken');

let userdata = {
    username: req.headers['username'],
    password: req.headers['password']
    };
    
    //Go to server for user varificarion
    if (userdata.username == process.env.USERNAME && userdata.password == process.env.PASSWORD) {
    res.status(200).json({
    message: 'Login Successful'
    });
    }
    else {
    res.status(401).json({
    message: 'Login Failed'
    });
    next();
    }
     
        module.exports = router;
    