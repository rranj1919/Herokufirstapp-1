const { pool } = require('../config');
const os = require('os');
const { isAuthorizedSoap } = require('./authSoap');


// SOAP SERVICE METHODS

// @route   POST api/soap
// @desc    Get table (object) by name
// @access  Private
const getTableByName = async (args, cb, headers) => {
    console.log('New SOAP request');

    // Deny Unauthorized Requests
    if(!isAuthorizedSoap(headers)) {
        throw {
            Fault: {
              Reason: { Text: 'Unauthorized' },
              statusCode: 401
            }
        };
    }

    // If here - user has provided correct credentials and is authorized
    console.log("User Authorized");

    // Try get data from DB
    try {
        // Get IP address
        console.log("CURRENT IP: ", os.networkInterfaces());

        // Connect to DB
        const client = await pool.connect();

        console.log('Getting table by name');
        const result = await client.query(`SELECT * FROM ${args.tableName}`);
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
        client.release();

        var results = {
            'table': args.tableName,
            'result': (result) ? resultsArray : null
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

// @route   POST api/soap
// @desc    Get all tables
// @access  Private
const getAllTables = async (args, cb, headers) => {
    console.log('New SOAP request');

    // Deny Unauthorized Requests
    if(!isAuthorizedSoap(headers)) {
        throw {
            Fault: {
              Reason: { Text: 'Unauthorized' },
              statusCode: 401
            }
        };
    }

    // Try get data from DB
    try {
        // Get IP address
        console.log("CURRENT IP: ", os.networkInterfaces());

        // Connect to DB
        const client = await pool.connect();

        // Get all table names
        // Change table_schema='salesforce' to other schema to show that specific schema
        // Or remove it to show all
        const tableQuery = await client.query(`SELECT table_name
                                            FROM information_schema.tables
                                            WHERE table_schema='salesforce'
                                            AND table_type='BASE TABLE'
                                            LIMIT 2`);
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

module.exports = {
    getTableByName,
    getAllTables
}