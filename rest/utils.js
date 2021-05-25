const createWhereClause = (fields, fromDate, toDate) => {

    var dateField;
    if (fields.some(field => field.column_name === 'systemmodstamp')) {
        console.log("has systemmodstamp");
        dateField = 'systemmodstamp';
    } else if (fields.some(field => field.column_name === 'lastmodifieddate')) {
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

    return whereDate;
}

module.exports = {
    createWhereClause
}