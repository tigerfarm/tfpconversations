// Map between customer address and worker identity
// Used to determine to which worker route a new conversation with a particular customer
//
// {
//     customerAddress: workerIdentity
// }
//
// Example:
//     {
//         'whatsapp:+12345678': 'john@example.com'
//     }
const customersToWorkersMap = {

};

// Customers list
// Example:
// [
//   {
//      customer_id: 98,
//      display_name: 'Bobby Shaftoe',
//      channels: [
//          { type: 'email', value: 'bobby@example.com' },
//          { type: 'sms', value: '+123456789' },
//          { type: 'whatsapp', value: 'whatsapp:+123456789' }
//      ],
//      links: [
//          { type: 'Facebook', value: 'https://facebook.com', display_name: 'Social Media Profile' }
//      ],
//      details:{
//          title: "Information",
//          content: "Status: Active" + "\n\n" + "Score: 100"
//      },
//      worker: 'john@example.com'
//   }
// ]

const customers = [
    {
        customer_id: 1,
        display_name: 'Coleridge',
        channels: [
            {type: 'sms', value: '+16503790077'}
        ],
        worker: 'lordbyron@example.com',
        avatar: 'https://someassets-1403.twil.io/Coleridge.jpg'
    },
    {
        customer_id: 2,
        display_name: 'Percy Byshee Shelley',
        channels: [
            {type: 'sms', value: '+16503790007'}
        ],
        worker: 'tigerfarm@gmail.com',
        avatar: 'https://someassets-1403.twil.io/Shelley.jpg'
    },
    {
        customer_id: 3,
        display_name: 'John Keats',
        channels: [
            // {type: 'sms', value: '+16508661007'},
            {type: 'whatsapp', value: '+16508661007'}
        ],
        worker: 'tigerfarm@gmail.com',
        avatar: 'https://someassets-1403.twil.io/Keats.jpg'
    },
    {
        customer_id: 33,
        display_name: 'Dave here',
        channels: [
            {type: 'sms', value: '+16505551111'}
        ],
        worker: 'tigerfarm@gmail.com',
        avatar: 'https://someassets-1403.twil.io/avatarMine1.jpg'
    },
    {
        customer_id: 34,
        display_name: 'Lord Byron',
        channels: [
            {type: 'sms', value: '+16505552222'}
        ],
        worker: 'coleague@twilio.com'
    }
];

const findWorkerForCustomer = async (customerNumber) => customersToWorkersMap[customerNumber];

const findRandomWorker = async () => {
    const onlyUnique = (value, index, self) => {
        return self.indexOf(value) === index;
    };

    const workers = Object.values(customersToWorkersMap).filter(onlyUnique)
    const randomIndex = Math.floor(Math.random() * workers.length)

    return workers[randomIndex]
};

const getCustomersList = async (worker, pageSize, anchor) => {
    const workerCustomers = customers.filter(customer => customer.worker === worker);
    // const workerCustomers = customers;
    const list = workerCustomers.map(customer => ({
            display_name: customer.display_name,
            customer_id: customer.customer_id,
            avatar: customer.avatar
        }));

    if (!pageSize) {
        return list;
    }

    if (anchor) {
        const lastIndex = list.findIndex((c) => String(c.customer_id) === String(anchor))
        const nextIndex = lastIndex + 1
        return list.slice(nextIndex, nextIndex + pageSize)
    } else {
        return list.slice(0, pageSize)
    }
};

const getCustomerByNumber = async (customerNumber) => {
    return customers.find(customer => customer.channels.find(channel => String(channel.value) === String(customerNumber)));
};

const getCustomerById = async (customerId) => {
    return customers.find(customer => String(customer.customer_id) === String(customerId));
};

module.exports = {
    customersToWorkersMap,
    findWorkerForCustomer,
    findRandomWorker,
    getCustomerById,
    getCustomersList,
    getCustomerByNumber
};
