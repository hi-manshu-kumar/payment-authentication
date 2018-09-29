const express = require("express");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 1234;
const keys = require('./config/keys');
const stripe = require('stripe')('keys.stripeSecretKey');
const exphbs = require('express-handlebars');

app = express();

//Handlebars Middleware
app.engine('handlebars', exphbs({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

// set static folder
app.use(express.static(`${__dirname}/public`));

// index route
app.get('/', (req, res) => {
    res.render('index', {
        stripePublishableKey: keys.stripePublishableKey 
    });
});

// app.get('/success', (req, res) => {
//     res.render('index');
// });

// Charge route
app.post('/charge', (req, res) => {
    const amount = 2500;

    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
    }).then(customer => stripe.charges.create({
        amount,
        description: 'Web Development Ebook',
        currency:'USD',
        customer: customer.id
    }))
    .then(charge => res.render('success'));
});

//Index Route
app.get('/', (req, res) => {
    res.render('index');
});

app.listen(PORT, () => {
    console.log("--connection open--");
    console.log(`server running on port ${port}.....`);
});