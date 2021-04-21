// Authorize request middleware - used in REST routes
module.exports = function(req, res, next) {
    

    // Try authorize user
    try {
        console.log("Authorizing user ", req.header('username'));
        // Check if credentials are missing
        if(!req.header('username') || !req.header('password')) {
            console.log('Unauthorized request');
            return res.status(401).json({ msg: 'Missing Credentials' });
        }
        // Check if credentials are correct
        if(req.header('username') == process.env.USERNAME && req.header('password') == process.env.PASSWORD) {
            console.log("User Authorized")
            next();
        } else {
            console.log('Unauthorized request');
            res.status(401).json({ msg: 'Unauthorized' });
        }
    } catch (err) {
        console.log('Unauthorized request');
        res.status(401).json({ msg: 'Unauthorized' });
    }

    /*
    // Check base64 encoded 'Authorization' header
    try {
        // Add .slice(6) to remove postman's 'Basic ' in begining of auth header
        const buff = Buffer.from(req.header('Authorization').slice(6), 'base64');
        const authStr = buff.toString('utf-8');

        // ['username', 'password']
        const splitAuthStr = authStr.split(':');

        // (if required) - check credentials with heroku config vars
        if(splitAuthStr[0] == process.env.USERNAME && splitAuthStr[1] == process.env.PASSWORD) {
            next();
        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    } catch(err) {
        console.log('No Encoded Authorization Header');
        // res.status(401).json({ msg: 'Unauthorized' });
    }
    */
}