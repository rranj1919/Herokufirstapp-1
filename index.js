const express = require('express');
const soap = require('soap');
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const auth = require('./authRest');
const { pool } = require('./config');
//const { isAuthorizedSoap } = require('./authSoap');

// Init express app
const app = express();
const router = express.Router();

// Read the WSDL file
const xml = require('fs').readFileSync('service.wsdl', 'utf8');

// Brute Force / DDos-attack protection
// Set rate-limit - max 100 requests every 30 min
const limiter = rateLimit({
    windowMs: 30 * 60 * 1000, 
    max: 100,
    message: {
        limit: 'Request limit reached.'
    },
    onLimitReached: function(req, res) {
        console.log('API Request Limit Reached.');
    }
});
app.use(limiter);

// Set HTTP header security in responses with helmet
app.use(helmet());

// SOAP SERVICE METHODS
// Get table from postgres DB by table name - used by SOAP service
const getTableByName = async (args, cb, headers) => {
    console.log('New SOAP request');

    /* Deny Unauthorized Requests
    if(!isAuthorizedSoap(headers)) {
        throw {
            Fault: {
              Reason: { Text: 'Unauthorized' },
              statusCode: 401
            }
        };
    }*/

    // If here - user has provided correct credentials and is authorized
    console.log("User Authorized");

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
        throw {
            Fault: {
              Reason: { Text: 'Error getting table by name' },
              statusCode: 500
            }
        };
    }
}

// Get data from all tables in the heroku postgresql DB - used by SOAP service
const getAllTables = async (args, cb, headers) => {
    console.log('New SOAP request');

    /*// Deny Unauthorized Requests
    if(!isAuthorizedSoap(headers)) {
        throw {
            Fault: {
              Reason: { Text: 'Unauthorized' },
              statusCode: 401
            }
        };
    }
	*/

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
            console.log('Querying table: ', table.table_name);
            let result = await client.query(`SELECT * FROM salesforce.${table.table_name}`)
            let resultsArray = result.rows;
            for (const result of resultsArray){
                // loop through all object fields and check for fields with objects (date)
                // convert to ISOstring so it can be passed in SOAP response
                for (const [key, value] of Object.entries(result)) {
                    if(typeof(value) == 'object' && value != null) {
                        result[key] = value.toISOString();
                    }
                }
            }
            results[table.table_name] = resultsArray;
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
        throw {
            Fault: {
              Reason: { Text: 'Error getting all tables' },
              statusCode: 500
            }
        };
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
        res.status(500).send('ERROR: ', err);
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
        // Or remove it to get tables from all schemas
        const tableQuery = await client.query(`SELECT table_name
                                            FROM information_schema.tables
                                            WHERE table_schema='salesforce'
                                            AND table_type='BASE TABLE'`);
        const tableArray = tableQuery.rows;
        console.log('Getting ' + tableArray.length + ' tables');
         
        // Loop through all tables and query them - save in results obj
        results = {};
        for(const table of tableArray) {
            let result = await client.query(`SELECT * FROM salesforce.${table.table_name}`)
            results[table.table_name] = result.rows;
        };  
        
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
        res.status(500).send('ERROR: ', err);
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