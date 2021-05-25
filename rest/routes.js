const express = require('express');
const router = express.Router();
const auth = require('./authRest');
const { pool } = require('../config');
const { createWhereClause } = require('./utils');

// @route   GET api/rest/get/:tableName
// @desc    Get table (object) by name
// @access  Private
router.get('/get/:tableName', auth, async (req, res) => {
    const { tableName } = req.params;

    // Try get data from db
    try {
        const client = await pool.connect();
        console.log('Getting table by name');
        const result = await client.query(`SELECT * FROM ${tableName}`);
        client.release();

        const results = {
            'object': tableName,
            'result': (result) ? result.rows : null
        }

        return res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/rest/getAllTables
// @desc    Get all tables (objects)
// @access  Private 
router.get('/getAllTables', auth, async (req, res) => {
    
    // Try get data from db
    try {
        const client = await pool.connect();
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
       
        client.release();

        return res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/rest/get
// @desc    Get all or specific table based on query paramters e.g. /api/rest/get?object=ObjName&from=2021-01-01&to=2021-01-14
// @access  Private 
router.get('/get', auth, async (req, res) => {
    const object = req.query.object;
    const toDate = req.query.to;
    const fromDate = req.query.from;
    console.log('Object query param: ', object);

    const client = await pool.connect();

    // Try get data from db
    // Check if object param is all or undefined - then query all tables
    if(object === "all" || !object) {
        try{
            console.log('Getting all tables');
            const tableQuery = await client.query(`SELECT table_name
                                                FROM information_schema.tables
                                                WHERE table_schema='salesforce'
                                                AND table_type='BASE TABLE'`);
            const tableArray = tableQuery.rows;

            results = {};
            
            // Loop through all tables and query them - save in results obj
            for(const table of tableArray) {
                console.log('Querying: ', table.table_name);
                let whereDate = createWhereClause(table.table_name, fromDate, toDate);
                console.log("WHERE CLAUSE: ", whereDate);
                let result = await client.query(`SELECT * FROM salesforce.${table.table_name} ${whereDate}`);
                if(result.rows.length > 0) {
                    results[table.table_name] = result.rows;
                }
            };

            client.release();

            return res.status(200).json(results);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
        
    } else {
        // Else - query specific object
        try {
            let whereDate = createWhereClause(object, fromDate, toDate);
            console.log("WHERE CLAUSE: ", whereDate);
            const result = await client.query(`SELECT * FROM salesforce.${object} ${whereDate}`);
            client.release();
    
            const results = {
                'object': object,
                'result': (result) ? result.rows : null
            }
    
            return res.status(200).json(results);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
});

module.exports = router