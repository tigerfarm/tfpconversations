const { getCustomerById, getCustomersList } = require('../../providers/customers');
/*
+ POST URL : https://example.herokuapp.com/callbacks/crm
--------------
+ Headers:
++ 0: "host":"example.herokuapp.com"
++ 1: "connection":"close"
++ 2: "content-type":"application/x-www-form-urlencoded; charset=UTF-8"
++ 3: "i-twilio-idempotency-token":"7369b88c-197c-415d-b310-086342ecd11d"
++ 4: "x-twilio-signature":"0r0eXrqoy8Sd5GOlTNoonHccZiY="
++ 5: "accept":"* / *"
++ 6: "x-home-region":"us1"
++ 7: "user-agent":"TwilioProxy/1.1"
++ 8: "x-request-id":"9b8003ae-2dda-45cf-968e-150b7060b7ca"
++ 9: "x-forwarded-for":"3.81.123.155"
++ 10: "x-forwarded-proto":"https"
++ 11: "x-forwarded-port":"443"
++ 12: "via":"1.1 vegur"
++ 13: "connect-time":"0"
++ 14: "x-request-start":"1663030127165"
++ 15: "total-route-time":"0"
++ 16: "content-length":"66"
POST Content ---------------------------------
+ Raw : 
PageSize=30&Worker=tigerfarm%40gmail.com&Location=GetCustomersList
POST Content ---------------------------------
+ Name value pairs: 
   "PageSize": "30",
   "Worker": "tigerfarm@gmail.com",
   "Location": "GetCustomersList",
 */

const crmCallbackHandler = async (req, res) => {
    // const location = req.query.location;
    const location = req.body.Location;
    console.log("+ location: " + location);

    // Location helps to determine which information was requested.
    // CRM callback is a general purpose tool and might be used to fetch different kind of information
    // const workerIdentity = req.tokenInfo.identity;
    const workerIdentity = req.body.Worker; // Not using a token.
    console.log("+ workerIdentity: " + workerIdentity);
    if (workerIdentity !== req.body.Worker) {
        console.log("+ Alow not using a token.");
        // return res.status(401).send('Worker and token does not match');
    }

    switch (location) {
        case 'GetCustomerDetailsByCustomerId': {
            await handleGetCustomerDetailsByCustomerIdCallback(req, res);
            return;
        }
        case 'GetCustomersList': {
            await handleGetCustomersListCallback(req, res);
            return;
        }

        default: {
            console.log('Unknown location: ', location);
            res.sendStatus(422);
        }
    }
};

const handleGetCustomerDetailsByCustomerIdCallback = async (req, res) => {
    console.log('+ Getting Customers details: handleGetCustomerDetailsByCustomerIdCallback');
    const body = req.body;
    
    // const workerIdentity = req.tokenInfo.identity;
    const workerIdentity = req.body.Worker; // Not using a token.
    const customerId = body.CustomerId;
    console.log('+ Getting Customer details, customerId: ', customerId);

    // Fetch Customer Details based on his ID
    // and information about a worker, that requested that information
    const customerDetails = await getCustomerById(customerId);
    console.log('+ customerDetails: ', customerDetails);
/*
+ Getting Customers details: handleGetCustomerDetailsByCustomerIdCallback
+ Getting Customer details, customerId:  2
+ customerDetails:  {
  customer_id: 2,
  display_name: 'Percy Byshee Shelley',
  company_name: 'Poets Inc',
  channels: [
    { type: 'sms', value: '+16503790007' },
    { type: 'sms', value: '+16508661366' }
  ],
  worker: 'tigerfarm@gmail.com',
  avatar: 'https://someassets-1403.twil.io/Shelley.jpg'
}
 */
    // Respond with Contact object
    res.send({
        objects: {
            customer: {
                customer_id: customerDetails.customer_id,
                display_name: customerDetails.display_name,
                channels: customerDetails.channels,
                links: customerDetails.links,
                avatar: customerDetails.avatar,
                details: customerDetails.details
            }
        }
    });
};

const handleGetCustomersListCallback = async (req, res) => {
    console.log('+ Getting Customers list: handleGetCustomersListCallback');

    const body = req.body;
    // const workerIdentity = req.tokenInfo.identity;
    const workerIdentity = req.body.Worker; // Not using a token.
    const pageSize = body.PageSize;
    const anchor = body.Anchor;

    // Fetch Customers list based on information about a worker, that requested it
    const customersList = await getCustomersList(workerIdentity, pageSize, anchor);
    console.log('+ customersList: ', customersList);
    /* + customersList:  [
  {
    display_name: 'Coleridge',
    customer_id: 1,
    avatar: 'https://someassets-1403.twil.io/Coleridge.jpg'
  },
  {
    display_name: 'Percy Byshee Shelley',
    customer_id: 2,
    avatar: 'https://someassets-1403.twil.io/Shelley.jpg'
  },
  {
    display_name: 'John Keats',
    customer_id: 3,
    avatar: 'https://someassets-1403.twil.io/Keats.jpg'
  },
  {
    display_name: 'Dave here',
    customer_id: 33,
    avatar: 'https://someassets-1403.twil.io/avatarMine1.jpg'
  }
]
    */
    // Respond with Customers object
    res.send({
        objects: {
            customers: customersList
        }
    });
};

module.exports = crmCallbackHandler;
