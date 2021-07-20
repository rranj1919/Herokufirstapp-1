module.exports = function(req, res, next) {


    //Go to server for user varificarion
    if (req.header('username')  == process.env.USERNAME && req.header('username')  == process.env.PASSWORD) {
    next();
    }
     
}
    