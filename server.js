const express = require('express');
const bodyParser = require('body-parser');
const keys = require('./config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const handlebar = require('express-handlebars');
const path = require('path');
const app = express();
const paypal = require('paypal-rest-sdk');
const Paytm = require('paytm-sdk');
const paytm = new Paytm('keys.merchantkey');
const cors = require("cors");
const ejs = require("ejs");

const {initPayment, responsePayment} = require("./paytm/services/index");

app.use(cors());

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': keys.client_id,
    'client_secret': keys.client_secret
  });

if(process.env.BASE_URL){
    var returnUrl = `${process.env.BASE_URL}/success`;
    var cancelUrl = `${process.env.BASE_URL}/cancel`;
} else{
    var returnUrl = "http://localhost:3000/success";
    var cancelUrl = "http://localhost:3000/error";
}

//Handlebars Middleware
app.engine('handlebars', handlebar({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// set static folder
app.use(express.static(__dirname+ '/public'));

// index route
app.get('/', (req, res) => {
    res.render('index.handlebars',{
        stripePublishableKey: keys.stripePublishableKey
    }); 

}); 

// app.get('/success', (req, res) => {
//     res.render('index');
// });

// Charge route
app.post('/charge', (req, res) => {
    const amount = 1000;

    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
    }).then(customer => stripe.charges.create({
        amount,
        description: 'Web Development ebook',
        currency: 'USD',
        customer:customer.id  
    })).then(charge => res.render('success.handlebars'));
});

app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url":  returnUrl,
            "cancel_url": cancelUrl
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "E-Notes",
                    "sku": "001",
                    "price": "10.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "10.00"
            },
            "description": "Web Development ebook"
        }]
    };
    
    
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i=0; i < payment.links.length; i++){
                if(payment.links[i].rel === 'approval_url'){
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
})

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    var execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "10.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));   
            res.render("success.handlebars");
        }
    });
});
app.use(express.static(__dirname + "/views"));
app.set("view engine", "ejs");

app.post("/paytm", (req, res) => {
   res.redirect("/paywithpaytm?amount=700");
})

app.get("/paywithpaytm", (req, res) => {
    initPayment(req.query.amount).then(
        success => {
            res.render("paytmRedirect.ejs", {
                resultData: success,
                paytmFinalUrl: 'https://securegw-stage.paytm.in/theia/processTransaction'
            });
        },
        error => {
            res.send(error);
        }
    );
});

app.post("/paywithpaytmresponse", (req, res) => {
    responsePayment(req.body).then(
        success => {
            res.render("success.handlebars");
        },
        error => {
            res.send(error);
        }
    );
});

app.get('/cancel', (req, res) => {
    res.render("error.handlebars");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("--connection open--");
    console.log(`server running on port ${port}.....`);
}); 

// himankpersonal@gmail.com priyanshu
//42424242442424
//7777777777 489871