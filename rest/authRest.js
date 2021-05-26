// Authorize request middleware - used in REST routes
module.exports = function(req, res, next) {
    console.log('New REST request');
    console.log('REQUEST HEADERS: ', req.headers);
    /*
    // Try authorize user
    try {
        console.log('Authorizing request from ' + req.header('username') +'...');

        // Check if credentials are missing
        if(!req.header('username') || !req.header('password')) {
            console.log('Unauthorized request');
            return res.status(401).json({ msg: 'Missing Credentials' });
        }

        // Check if credentials are correct
        if(req.header('username') == process.env.USERNAME && req.header('password') == process.env.PASSWORD) {
            console.log("Request Authorized")
            next();
            
        } else {
            console.log('Unauthorized request');
            return res.status(401).json({ msg: 'Unauthorized request' });
        }
    } catch (err) {
        console.log('Unauthorized request');
        return res.status(401).json({ msg: 'Unauthorized request' });
    }

    */

    // Check base64 encoded 'Authorization' header
    try {
        // Add .slice(6) to remove 'Basic ' in begining of auth header
        const buff = Buffer.from(req.header('Authorization').slice(6), 'base64');
        const authStr = buff.toString('utf-8');

        // ['username', 'password']
        const splitAuthStr = authStr.split(':');

        // (if required) - check credentials with heroku config vars
        if(splitAuthStr[0] == process.env.USERNAME && splitAuthStr[1] == process.env.PASSWORD) {
            next();
        } else {
            res.status(401).json({ msg: 'Unauthorized request' });
        }
    } catch(err) {
        console.log('Unauthorized request');
        res.status(401).json({ msg: 'Unauthorized request' });
    }
    
}