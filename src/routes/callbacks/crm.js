const { getCustomerById, getCustomersList } = require('../../providers/customers');

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
    const body = req.body;
    console.log('Getting Customer details: ', body.CustomerId);

    // const workerIdentity = req.tokenInfo.identity;
    const workerIdentity = req.body.Worker; // Not using a token.
    const customerId = body.CustomerId;

    // Fetch Customer Details based on his ID
    // and information about a worker, that requested that information
    const customerDetails = await getCustomerById(customerId);

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
    console.log('Getting Customers list');

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
