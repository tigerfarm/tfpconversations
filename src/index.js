console.log("+++ Start Frontline CRM Application web server.");
console.log("+ Test URL from a browser: http://example.com/hello");
const createApp = require('./create-app');
const routes = require('./routes');

// -----------------------------------------------------------------------------
// Get environment variable values into a program object, and display the values.
const config = require('./config');
console.log("+ config.twilio.sso_realm_sid: " + config.twilio.sso_realm_sid);
console.log("+ config.twilio.account_sid: " + config.twilio.account_sid);
console.log("+ config.twilio.sms_number: " + config.twilio.sms_number);
console.log("+ config.twilio.whatsapp_number: " + config.twilio.whatsapp_number);

// -----------------------------------------------------------------------------
const app = createApp(config);
routes(app);

// -----------------------------------------------------------------------------
app.get('/hello', function (req, res) {
    res.send('+ hello there.');
});

// -----------------------------------------------------------------------------
app.listen(config.port, () => {
	console.info(`Application started at ${config.port}`);
});
