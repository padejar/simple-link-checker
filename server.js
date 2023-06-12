const express = require('express');
const bodyParser = require('body-parser');
const port = 3000;

require('dotenv').config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/screenshots', express.static(__dirname + '/screenshots'));
app.use('/assets', express.static(__dirname + '/public/assets'));
app.set('view engine', 'ejs');

require('./src/app')(app);

app.listen(port, () => {
    console.log(`Link checker is running on port ${port}`);
});