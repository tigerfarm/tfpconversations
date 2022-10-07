console.log("+++ Start Frontline CRM Application web server.");
console.log("+ Check the server a browser: http://example.com/");

// const createApp = require('./create-app');
const createApp = require('express');

const routes = require('./routes');

// -----------------------------------------------------------------------------
// Get environment variable values into a program object, and display the values.
const config = require('./config');
console.log("+ config.twilio.sso_realm_sid: " + config.twilio.sso_realm_sid);
console.log("+ config.twilio.account_sid: " + config.twilio.account_sid);
console.log("+ config.twilio.sms_number: " + config.twilio.sms_number);
console.log("+ config.twilio.whatsapp_number: " + config.twilio.whatsapp_number);

const app = createApp(config);
routes(app);

// -----------------------------------------------------------------------------
// CRM requests based on src/routes/callbacks/crm.js

const customers = [
    {
        customer_id: 1,
        display_name: 'Coleridge',
        company_name: 'Poets Inc',
        channels: [
            {type: 'sms', value: '+16503790077'}
        ],
        worker: 'coleague@twilio.com',
        avatar: 'https://someassets-1403.twil.io/Coleridge.jpg'
    },
    {
        customer_id: 2,
        display_name: 'Percy Byshee Shelley',
        company_name: 'Poets Inc',
        channels: [
            {type: 'sms', value: '+16503790007'},
            {type: 'sms', value: '+16508661366'}
        ],
        worker: 'tigerfarm@gmail.com',
        avatar: 'https://someassets-1403.twil.io/Shelley.jpg'
    },
    {
        customer_id: 3,
        display_name: 'John Keats',
        company_name: 'Tiger Farm Press',
        channels: [
            {type: 'sms', value: '+16508661007'},
            {type: 'whatsapp', value: 'whatsapp:+16508661007'}
        ],
        worker: 'tigerfarm@gmail.com',
        avatar: 'https://someassets-1403.twil.io/Keats.jpg'
    },
    {
        customer_id: 33,
        display_name: 'Dave here',
        company_name: 'Poets Inc',
        channels: [
            {type: 'sms', value: '+16504837603'}
        ],
        worker: 'tigerfarm@gmail.com', // Okta Person username
        avatar: 'https://someassets-1403.twil.io/avatarMine1.jpg'
    },
    {
        customer_id: 34,
        display_name: 'Lord Byron',
        company_name: 'Poets Inc',
        channels: [
            {type: 'sms', value: '+16505552222'}
        ],
        worker: 'coleague@twilio.com'
    }
];
app.post("/callbacks/abc", function (req, res) {
    // console.log("++ customers: " + JSON.stringify(customers));
    theData = "";
    req.on('data', function (data) {
        // ---------------------------------------------------------------------
        // From the body of the POST request,
        //      Get the type of request: Location, and the Worker id: Worker.
        console.log("++ Request body :" + data + ":");
        theData += data;
        // :Location=GetCustomersList&Worker=dave%40example.com:
        thePairMessages = "";
        var thePairs = theData.split("&");
        theLength = thePairs.length;
        theWorker = "";
        for (var i = 0; i < theLength; i++) {
            aPair = thePairs[i].split("=");
            thePairMessage = '   "' + aPair[0] + '": "' + decodeURIComponent(aPair[1] + '",');
            thePairMessages = thePairMessages + thePairMessage + "\n";
            if (aPair[0] === "Worker") {
                theWorker = decodeURIComponent(aPair[1]);
            }
            if (aPair[0] === "Location") {
                theLocation = decodeURIComponent(aPair[1]);
            }
        }
        // console.log("++ thePairMessage: " + thePairMessages);
        console.log("++ theWorker: " + theWorker);
        // ---------------------------------------------------------------------
        // Handle each type of request.
        switch (theLocation) {
            case 'GetCustomerDetailsByCustomerId':
            {
                console.log("++ GetCustomerDetailsByCustomerId.");
                // Not yet implemented.
                res.sendStatus(422);
                return;
            }
            case 'GetCustomersList':
            {
                console.log("++ GetCustomerDetailsByCustomerId.");
                // Get data into proper format, and respond with it.
                const workerCustomers = customers.filter(customer => customer.worker === theWorker);
                // console.log("++ workerCustomers: " + JSON.stringify(workerCustomers));
                const workerCustomersList = workerCustomers.map(customer => ({
                        display_name: customer.display_name,
                        customer_id: customer.customer_id,
                        avatar: customer.avatar
                    }));
                console.log("++ Worker's Customers list: " + JSON.stringify(workerCustomersList));
                res.send({
                    objects: {
                        customers: workerCustomersList
                    }
                });
                return;
            }
            default:
            {
                console.log('Unknown request type, Location: ', location);
                res.sendStatus(422);
                return;
            }
        }
    });
});

// -----------------------------------------------------------------------------
app.get('/hello', function (req, res) {
    res.send('+ hello there.');
});
app.get('/', function (req, res) {
    res.send('+ Frontline Integration Service Application');
});
app.get('*', function (req, res) {
    res.send('+ Frontline Integration Service Application requests need to POST HTTP requests.');
});

// -----------------------------------------------------------------------------
app.listen(config.port, () => {
    console.info(`Application started at ${config.port}`);
});
