const express = require('express');
const soap = require('soap');
const app = express();
const router = express.Router();
const { pool } = require('./config');

const PORT = process.env.PORT || 5000;

// Read the WSDL file
const xml = require('fs').readFileSync('service.wsdl', 'utf8');

// Get table from postgres DB by table name - used by soap service
const getTableByName = async (args, cb, headers) => {

    // Deny Unauthorized Requests
    try {
        // Check if username exists
        if(!headers.Security.UsernameToken.Username || headers.Security.UsernameToken.Username !== process.env.USERNAME) {
            console.log('Unauthorized request');
                return {
                    error: 'Unauthorized User'
                }
        }

        // Check if password matches
        if(!headers.Security.UsernameToken.Password['$value'] || headers.Security.UsernameToken.Password['$value'] !== process.env.PASSWORD) {
            console.log('Unauthorized request');
                return {
                    error: 'Unauthorized User'
                }
        }
    } catch(err) {
        console.error('Authentication Error: ', err);
        return {
            error: 'Authentication Error: ' + err
        }
    }

    // Connect to DB
    const client = await pool.connect();

    // Try get data from DB
    try {
        console.log('Getting table by name');
        console.log('Querying table: ', args.tableName);
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

// Get data from all tables in the heroku postgresql DB - used by soap service
const getAllTables = async (args, cb, headers) => {

    // Deny Unauthorized Requests
    try {
        // Check if username exists
        if(!headers.Security.UsernameToken.Username || headers.Security.UsernameToken.Username !== process.env.USER) {
            console.log('Unauthorized request');
                return {
                    error: 'Unauthorized User'
                }
        }

        // Check if password matches
        if(!headers.Security.UsernameToken.Password['$value'] || headers.Security.UsernameToken.Password['$value'] !== process.env.KEY) {
            console.log('Unauthorized request');
                return {
                    error: 'Unauthorized User'
                }
        }
    } catch(err) {
        console.error('Authentication Error: ', err);
        return {
            error: 'Authentication Error: ' + err
        }
    }

    // Connect to DB
    const client = await pool.connect();

    // Try get data from DB
    try {
        // Get all table names
        // Change table_schema='salesforce' to other schema to show that specific schema
        // Or remove it to show all
        console.log('Getting all tables');
        const tableQuery = await client.query(`SELECT table_name
                                            FROM information_schema.tables
                                            WHERE table_schema='salesforce'
                                            AND table_type='BASE TABLE'`);
        const tableArray = tableQuery.rows;

        console.log('Table Array: ', tableArray);

        results = {};
        /* 
        // Loop through all tables and query them - save in results obj
        for(const table of tableArray) {
            console.log('Querying table: ', table.table_name);
            let result = await client.query(`SELECT * FROM salesforce.${table.table_name}`)
            results[table.table_name] = result.rows;
        };
        */

        // FOR TESTING - Getting a specific amount tables instead of all (set in for loop i < [num of tables])
        var i;
        for(i = 0; i < 5; i++) {
            console.log('Querying table: ', tableArray[i].table_name);
            let result = await client.query(`SELECT * FROM salesforce.${tableArray[i].table_name}`)
            results[tableArray[i].table_name] = result.rows;
        }
        

        client.release();

        return {
            results
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
            GetTableByName: getTableByName,
            GetAllTables: getAllTables
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

// Setup rest route
app.use('/api/rest', router);

app.listen(PORT, () => {
    // Setup soap route
    const endpoint = '/api/soap';
    const soapServer = soap.listen(app, endpoint, soapService, xml);
    console.log(`Server is listening on ${PORT}`);
});