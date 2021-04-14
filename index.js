const express = require('express');
const app = express();
const router = express.Router();
const routes = require('./routes');

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Test API");
});

// Get all rows from the table test_table
router.get('/getAllTables', routes.routeController.getAll);

// Dynamically get specific table
router.get('/get/:table', routes.routeController.getSpecificTable);

// Dynamically get specific table and record
router.get('/get/:table/:id', routes.routeController.getSpecificRecord);

app.use('/api/v1', router);

app.listen(PORT, () => console.log(`Server is listening on ${PORT}`));