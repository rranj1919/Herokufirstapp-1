const express = require('express');
const router = express.Router();
const auth = require('./authRest');
const { pool } = require('../config');

// @route   GET api/rest/get/:tableName
// @desc    Get table (object) by name
// @access  Private
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

// @route   GET api/rest/getAllTables
// @desc    Get all tables (objects)
// @access  Private 
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

module.exports = router