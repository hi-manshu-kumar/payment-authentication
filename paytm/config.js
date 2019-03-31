const keys = require('../config/keys.js');

if(process.env.NODE_ENV === 'production'){
  var returnUrl = `${keys.BASE_URL}`;
} else{
  var returnUrl = "http://localhost:3000";
}

module.exports = {
  MID: "DyXmrG94525304537824",
  PAYTM_MERCHANT_KEY: "E4#%bLky8QUKMbMy",
  PAYTM_FINAL_URL: 'https://securegw-stage.paytm.in/theia/processTransaction',
  WEBSITE: "WEBSTAGING",
  CHANNEL_ID: "WEB",
  INDUSTRY_TYPE_ID: "Retail",
  CALLBACK_URL: `${returnUrl}/paywithpaytmresponse`
};
