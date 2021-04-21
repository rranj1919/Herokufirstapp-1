const express = require('express');
const soap = require('soap');
const app = express();
const router = express.Router();
const rateLimit = require("express-rate-limit");
const auth = require('./auth');
const { pool } = require('./config');

// Read the WSDL file
const xml = require('fs').readFileSync('service.wsdl', 'utf8');

// DDos-attack protection
// Set rate-limit - max 100 requests every 30 min
const limiter = rateLimit({
    windowMs: 30 * 60 * 1000, 
    max: 100,
    message: {
        limit: 'Request limit reached, try again later.'
    }
});
app.use(limiter);

// SOAP SERVICE METHODS
// Get table from postgres DB by table name - used by soap service
const getTableByName = async (args, cb, headers) => {
    console.log('New SOAP request');
    // Deny Unauthorized Requests
    try {
        console.log('Authorizing user ' + headers.Security.UsernameToken.Username +'...');
        // Check if username exists
        if(!headers.Security.UsernameToken.Username || headers.Security.UsernameToken.Username !== process.env.USERNAME) {
            console.log('Unauthorized request');
            return {
                error: 'Unauthorized'
            }
        }

        // Check if password exists and matches
        if(!headers.Security.UsernameToken.Password['$value'] || headers.Security.UsernameToken.Password['$value'] !== process.env.PASSWORD) {
            console.log('Unauthorized request');
            return {
                error: 'Unauthorized User'
            }
        }
    } catch(err) {
        // Errors if the authentication headers are not provided
        console.error('Authentication Error: ', err);
        return {
            error: 'Authentication Error: ' + err
        }
    }

    // If here - user has provided correct credentials and is authorized
    console.log("User Authorized")

    // Connect to DB
    const client = await pool.connect();

    // Try get data from DB
    try {
        console.log('Getting table by name');
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
        console.log('Error getting table by name: ', err);
        return {
            error: 'Error getting table by name: ' +err
        }
    }
}

// Get data from all tables in the heroku postgresql DB - used by soap service
const getAllTables = async (args, cb, headers) => {
    console.log('New SOAP request');

    // Deny Unauthorized Requests
    try {
        console.log('Authorizing user ' + headers.Security.UsernameToken.Username +'...');
        // Check if username exists
        if(!headers.Security.UsernameToken.Username || headers.Security.UsernameToken.Username !== process.env.USERNAME) {
            console.log('Unauthorized request');
            return {
                error: 'Unauthorized User'
            }
        }

        // Check if password exists and matches
        if(!headers.Security.UsernameToken.Password['$value'] || headers.Security.UsernameToken.Password['$value'] !== process.env.PASSWORD) {
            console.log('Unauthorized request');
            return {
                error: 'Unauthorized User'
            }
        }
    } catch(err) {
        // Errors if the authentication headers are not provided
        console.error('Authentication Error: ', err);
        return {
            error: 'Authentication Error: ' + err
        }
    }

    // If here - user has provided correct credentials and is authorized
    console.log("User Authorized")

    // Connect to DB
    const client = await pool.connect();

    // Try get data from DB
    try {
        // Get all table names
        // Change table_schema='salesforce' to other schema to show that specific schema
        // Or remove it to show all
        const tableQuery = await client.query(`SELECT table_name
                                            FROM information_schema.tables
                                            WHERE table_schema='salesforce'
                                            AND table_type='BASE TABLE'`);
        const tableArray = tableQuery.rows;

        results = {};
         
        // Loop through all tables and query them - save in results obj
        for(const table of tableArray) {
            let result = await client.query(`SELECT * FROM salesforce.${table.table_name}`)
            results[table.table_name] = result.rows;
        };
        console.log('Getting ' + tableArray.length + ' tables');
        /*
        // FOR TESTING - Getting a specific amount tables instead of all (set in for loop i < [num of tables])
        var i;
        for(i = 0; i < 5; i++) {
            let result = await client.query(`SELECT * FROM salesforce.${tableArray[i].table_name}`);
            results[tableArray[i].table_name] = result.rows;
        }
        */
        client.release();

        return {
            results
        }
        
    } catch (err) {
        console.log('Error getting all tables: ',err);
        return {
            error: 'Error getting all tables: ' + err
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

// REST SERVICE
// Get specific table by name
// Secure Route - with auth.js middleware
router.get('/get/:tableName', auth, async (req, res) => {
    const { tableName } = req.params;
    const client = await pool.connect();

    // Try get data from db
    try {
        console.log('Getting table by name');
        const result = await client.query(`SELECT * FROM ${tableName}`);
        client.release();

        const results = {
            'table': tableName,
            'result': (result) ? result.rows : null
        }

        return res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(400).send('ERROR: ', err);
    }
});

// Get all tables
// Secure Route - with auth.js middleware
router.get('/getAllTables', auth, async (req, res) => {
    const client = await pool.connect();

    // Try get data from db
    try {
        // Get all table names
        // Change table_schema='salesforce' to other schema to show that specific schema
        // Or remove it to show all
        const tableQuery = await client.query(`SELECT table_name
                                            FROM information_schema.tables
                                            WHERE table_schema='salesforce'
                                            AND table_type='BASE TABLE'`);
        const tableArray = tableQuery.rows;

        results = {};
         
        // Loop through all tables and query them - save in results obj
        for(const table of tableArray) {
            let result = await client.query(`SELECT * FROM salesforce.${table.table_name}`)
            results[table.table_name] = result.rows;
        };

        console.log('Getting ' + tableArray.length + ' tables');
        
        /*
        // FOR TESTING - Getting a specific amount tables instead of all (set in for loop i < [num of tables])
        var i;
        for(i = 0; i < 5; i++) {
            console.log('Querying table: ', tableArray[i].table_name);
            let result = await client.query(`SELECT * FROM salesforce.${tableArray[i].table_name}`);
            results[tableArray[i].table_name] = result.rows;
        }
        */
        client.release();

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    // Setup soap route
    const endpoint = '/api/soap';
    const soapServer = soap.listen(app, endpoint, soapService, xml);
    console.log(`Server is listening on ${PORT}`);
});