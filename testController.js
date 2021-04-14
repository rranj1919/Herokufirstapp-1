const { pool } = require('./config');

const getAll = async (req, res) => {
    // Check Api Key - return 401 if not correct 
    //if(!req.header('apiKey') || req.header('apiKey') !== process.env.API_KEY) {
    //    return res.status(401).json({status: 'error', message: 'Unautorized'})
    //}

    // Try get data from db
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM salesforce.Dummy_Case__c');
        client.release();

        return res.status(200).json(result.rows);
      } catch (err) {
        console.error(err);
        res.send("Error - " + err);
      }
}

module.exports = {
    getAll
}