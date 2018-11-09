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

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': keys.client_id,
    'client_secret': keys.client_secret
  });

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
    res.render('index',{
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
    })).then(charge => res.render('success'));
});

app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/error"
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
            res.render("success");
        }
    });
});

app.post("/paytm", (req, res) => {
    var params 						= {};
	params['MID'] 					=keys.merchantkey;//by paytm
	params['WEBSITE']				= 'WEBSTAGING';//WEBSTAGING
	params['CHANNEL_ID']			= 'WEB';
	params['INDUSTRY_TYPE_ID']	= 'Retail';
	params['ORDER_ID']			= 'TEST_'  + new Date().getTime();
	params['CUST_ID'] 			= 'Customer001';
	params['TXN_AMOUNT']		= '720.00';
	params['CALLBACK_URL']		= 'https://pg-staging.paytm.in/MerchantSite/bankResponse';
	params['EMAIL']				= 'himanshu.kumar394@gmail.com';
	params['MOBILE_NO']			= '7011487692';

	checksum_lib.genchecksum(params, keys.merchantkey , function (err, checksum) {

		var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
		// var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for prod
		
		var form_fields = "";
		for(var x in params){
			form_fields += "<input type='hidden' name='"+x+"' value='"+params[x]+"' >";
		}
		form_fields += "<input type='hidden' name='CHECKSUMHASH' value='"+checksum+"' >";

		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="'+txn_url+'" name="f1">'+form_fields+'</form><script type="text/javascript">document.f1.submit();</script></body></html>');
		res.end();
	});
})

app.get('/cancel', (req, res) => {
    res.render("error");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("--connection open--");
    console.log(`server running on port ${port}.....`);
}); 