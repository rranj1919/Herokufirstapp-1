const express = require('express');
const soap = require('soap');
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { getAllTables, getTableByName } = require('./soap/operations');

// Init express app
const app = express();

// Brute Force / DDos-attack protection
// Set rate-limit - max 100 requests every 15 min
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: {
        limit: 'Request limit reached.'
    },
    onLimitReached: function(req, res) {
        console.log('API Request Limit Reached.');
    }
});
app.use(limiter);

// Setup HTTP header security in responses with helmet
app.use(helmet());

// Root handler
app.get("/", (req, res) => {
    res.send("SOAP & REST API Running");
});

// Setup rest route
app.use('/api/rest', require('./rest/routes'));

// Heroku set port dynamically or default 5000
const PORT = process.env.PORT || 5000;

// Read the WSDL file
const wsdlFile = require('fs').readFileSync('service.wsdl', 'utf8');

// Set soap endpoint
const endpoint = '/api/soap';

// Set soap service
const soapService = {
    SoapService: {
        SoapPort: {          
            GetTableByName: getTableByName,
            GetAllTables: getAllTables
        }
    }
};

app.listen(PORT, () => {
    // Setup soap server
    const soapServer = soap.listen(app, endpoint, soapService, wsdlFile);
    console.log(`Server is listening on ${PORT}`);
});