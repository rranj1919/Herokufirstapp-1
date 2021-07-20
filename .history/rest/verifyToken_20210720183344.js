const jwt = require('jsonwebtoken');
const {secretKey,algorithm} =require('./config');

module.exports = function(req, res, next) {

    const token = req.headers['x-access-token'];

    jwt.verify(token, secretKey,
        {
        algorithm: algorithm
        
        }, function (err, decoded) {
        if (err) {
        let errordata = {
        message: err.message,
        expiredAt: err.expiredAt
        };
        console.log(errordata);
        return res.status(401).json({
        message: 'Unauthorized Access'
        });
        }
        req.decoded = decoded;
        console.log(decoded);
        next();
        });




}