// Authorize request middleware - used in REST routes
module.exports = function(req, res, next) {
    // Check base64 encoded 'Authorization' header
    try {
        // Add .slice(6) to remove postman's 'Basic ' in begining of auth header
        const buff = Buffer.from(req.header('Authorization').slice(6), 'base64');
        const authStr = buff.toString('utf-8');

        // ['username', 'password']
        const splitAuthStr = authStr.split(':');

        // TODO (if required) - check credentials with heroku config vars  
    } catch(err) {
        console.log('No Encoded Authorization Header')
        // res.status(401).json({ msg: 'Unauthorized' })
    }
    
    // Check if credentials are missing
    if(!req.header('username') || !req.header('password')) {
        return res.status(401).json({ msg: 'Missing Credentials' })
    }

    // Try to check if credentials are correct
    try {
        if(req.header('username') == process.env.USERNAME && req.header('password') == process.env.PASSWORD) {
            next();
        } else {
            res.status(401).json({ msg: 'Unauthorized' })
        }
    } catch (err) {
        res.status(401).json({ msg: 'Unauthorized' })
    }
}