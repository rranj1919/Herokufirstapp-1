const { pool } = require('../config');

const createWhereClause = async (object, fromDate, toDate) => {
    const client = await pool.connect();
    var dateField;
    const fields = await client.query(`SELECT column_name 
                                    FROM information_schema.columns 
                                    WHERE table_schema = 'salesforce'
                                    AND table_name = '${object}'`);
    client.release();
    if (fields.rows.some(field => field.column_name === 'systemmodstamp')) {
        console.log("has systemmodstamp");
        dateField = 'systemmodstamp';
    } else if (fields.rows.some(field => field.column_name === 'lastmodifieddate')) {
        console.log("has lastmodifieddate");
        dateField = 'lastmodifieddate';
    } else {
        console.log("going with createddate");
        dateField = 'createddate';
    }
    // If there is to or from query params for date - create necessary WHERE clause
    var whereDate = '';
    if(toDate) {
        whereDate = fromDate ? `WHERE ${dateField} < '${toDate}' AND ${dateField} > '${fromDate}'` : `WHERE ${dateField} < '${toDate}'`;
    } else if(fromDate) {
        whereDate = `WHERE ${dateField} > '${fromDate}'`;
    }

    console.log("WHERE CLAUSE: ", whereDate);
    return whereDate;
}

module.exports = {
    createWhereClause
}