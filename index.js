const express = require('express');
const app = express();
const router = express.Router();
const routes = require('./routes');

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Test API");
});

// Get all rows from the table test_table
router.get('/test_table', routes.test.getAll);

app.use('/api', router);

app.listen(PORT, () => console.log(`Server is listening on ${PORT}`));