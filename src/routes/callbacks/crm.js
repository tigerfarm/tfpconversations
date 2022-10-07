const { getCustomerById, getCustomersList } = require('../../providers/customers');
/*
+ POST URL : https://example.com/callbacks/crm
POST Content ---------------------------------
+ Raw : 
PageSize=30&Worker=dave%40example.com&Location=GetCustomersList
POST Content ---------------------------------
+ Name value pairs: 
   "PageSize": "30",
   "Worker": "dave@example.com",
   "Location": "GetCustomersList",
 */

const crmCallbackHandler = async (req, res) => {
    // const location = req.query.location; // This would be if using HTTP GET instead of POST.
    const location = req.body.Location;
    console.log("+ location: " + location);
    const workerIdentity = req.body.Worker; 
    console.log("+ workerIdentity: " + workerIdentity);
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
    const workerIdentity = req.body.Worker;
    const customerId = body.CustomerId;
    console.log('+ Getting Customer details, customerId: ', customerId);
    const customerDetails = await getCustomerById(customerId);
    console.log('+ customerDetails: ', customerDetails);
/*
 *  Sample:
+ Getting Customers details: handleGetCustomerDetailsByCustomerIdCallback
+ Getting Customer details, customerId:  2
+ customerDetails:  {
  customer_id: 2,
  display_name: 'Percy Byshee Shelley',
  company_name: 'Poets Inc',
  channels: [
    { type: 'sms', value: '+16505551111' },
    { type: 'sms', value: '+16505552222' }
  ],
  worker: 'tigerfarm@gmail.com',
  avatar: 'https://abouttime-2357.twil.io/Shelley.jpg'
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
    const workerIdentity = req.body.Worker;
    const pageSize = body.PageSize;     // parseInt(body.PageSize);
    const anchor = body.Anchor;
    const customersList = await getCustomersList(workerIdentity, pageSize, anchor);
    console.log('+ customersList: ', customersList);
    /* + sample customersList:
[
  {
    display_name: 'Coleridge',
    customer_id: 1,
    avatar: 'https://abouttime-2357.twil.io/Coleridge.jpg'
  },
  {
    display_name: 'Percy Byshee Shelley',
    customer_id: 2,
    avatar: 'https://abouttime-2357.twil.io/Shelley.jpg'
  },
  {
    display_name: 'John Keats',
    customer_id: 3,
    avatar: 'https://abouttime-2357.twil.io/Keats.jpg'
  },
  {
    display_name: 'Dave here',
    customer_id: 33,
    avatar: 'https://abouttime-2357.twil.io/avatarMine1.jpg'
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
