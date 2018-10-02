const express = require('express');
const bodyParser = require('body-parser');
const keys = require('./config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const handlebar = require('express-handlebars');

const app = express();

//Handlebars Middleware
app.engine('handlebars', handlebar({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// set static folder
app.use(express.static(`${__dirname}/public`));

// index route
app.get('/', (req, res) => {
    console.log("req is", typeof req);
    console.log("res is", typeof res, res instanceof Array );
    res.render('index',{
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
        description: 'Web Development ebook',
        currency: 'USD',
        customer:customer.id  
    })).then(charge => res.render('success'));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("--connection open--");
    console.log(`server running on port ${port}.....`);
}); 