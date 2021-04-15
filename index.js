const express = require('express');
const soap = require('soap');
const app = express();
const router = express.Router();
const { pool } = require('./config');

const PORT = process.env.PORT || 5000;

// Read the WSDL file
const xml = require('fs').readFileSync('service.wsdl', 'utf8');

// Get table from postgres DB - used by soap service
const getTableByname = async (args) => {
    console.log('tableName: ', args.tableName);

    // Connect to DB
    const client = await pool.connect();

    // Try get data from DB
    try {
        const result = await client.query(`SELECT * FROM ${args.tableName}`);
        client.release();

        var results = {
            'table': args.tableName,
            'result': (result) ? result.rows : null
        };

        return {
            data: results
        }
    } catch (err) {
        console.error(err);
        return {
            error: err
        }
    }
}

// Set soap service
var soapService = {
    SoapService: {
        SoapPort: {          
            GetTable: getTableByname
        }
    }
};

// REST
// Get specific table by name
router.get('/get/:tableName', async (req, res) => {
    const { tableName } = req.params;
    console.log('TABLE: ', tableName);
    const client = await pool.connect();

    // Try get data from db
    try {
        const result = await client.query(`SELECT * FROM ${tableName}`);
        client.release();

        const results = {
            'table': tableName,
            'result': (result) ? result.rows : null
        };

        return res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(400).send('ERROR: ', err);
    }
});

// Root handler
app.get("/", (req, res) => {
    res.send("SOAP & REST API Running");
});

app.use('/api/rest', router);

app.listen(PORT, () => {
    // Setup soap
    const endpoint = '/api/soap';
    soap.listen(app, endpoint, soapService, xml);
    console.log(`Server is listening on ${PORT}`);
});