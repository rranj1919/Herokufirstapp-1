// Authorize request middleware - used in REST routes
module.exports = function(req, res, next) {
    // Check if credentials are missing
    if(!req.header('username') || !req.header('password')) {
        return res.status(401).json({ msg: 'Missing Credentials' })
    }

    console.log('Auth header: ', req.header('Authorization'))

    const buff = Buffer.from(base64, 'base64');
    const authStr = buff.toString('utf-8');
    console.log('Decoded: ', authStr);

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