//  WhatsApp templates.
//  If a template is approved, add ", whatsAppApproved: true" to the definition. For example:
//      ...
//      { content: compileTemplate(OPENER_ON_MY_WAY, customerDetails), whatsAppApproved: true },
//      ...
//
//  Customer JSON data is used to merge into the templates.
//      Customer JSON data: '../../providers/customers', 
//      const customers = [
//      {
//              customer_id: 1,
//              display_name: 'Coleridge',
//              channels: [
//                  {type: 'sms', value: '+16503790077'}
//              ],
//              worker: 'lordbyron@example.com',
//              avatar: 'https://someassets-1403.twil.io/Coleridge.jpg'
//          },
//
const { getCustomerById } = require('../../providers/customers');

const templatesCallbackHandler = async (req, res) => {
    const location = req.body.location;

    // Location helps to determine which information was requested.
    // CRM callback is a general purpose tool and might be used to fetch different kind of information
    switch (location) {
        case 'GetTemplatesByCustomerId': {
            await handleGetTemplatesByCustomerIdCallback(req, res);
            return;
        }

        default: {
            console.log('Unknown location: ', location);
            res.sendStatus(422);
        }
    }
};

// -----------------------------------------------------------------------------
const handleGetTemplatesByCustomerIdCallback = async (req, res) => {
    const body = req.body
    console.log('Getting templates: ', body.CustomerId);

    const workerIdentity = req.tokenInfo.identity;
    const customerId = body.CustomerId;
    const conversationSid = body.ConversationSid;

    const customerDetails = await getCustomerById(customerId);

    if (!customerDetails) {
        return res.status(404).send("Customer not found");
    }

    // -----------------------------
    // Prepare templates categories
    // Pre-approved templates for out of session messages: ", whatsAppApproved: true"
    //
    const openersCategory = {
        display_name: 'Openers', // Category name
        templates: [
            { content: compileTemplate(OPENER_NEXT_STEPS, customerDetails) }, // Compiled template
            { content: compileTemplate(OPENER_NEW_PRODUCT, customerDetails) },
            { content: compileTemplate(OPENER_ON_MY_WAY, customerDetails), whatsAppApproved: true },
            { content: compileTemplate(SANDBOX_TEMPLATE_1, customerDetails), whatsAppApproved: true },
            
        ]
    };
    const repliesCategory = {
        display_name: 'Replies',
        templates: [
            { content: compileTemplate(REPLY_SENT, customerDetails) },
            { content: compileTemplate(REPLY_RATES, customerDetails) },
            { content: compileTemplate(REPLY_OMW, customerDetails) },
            { content: compileTemplate(REPLY_OPTIONS, customerDetails) },
            { content: compileTemplate(REPLY_ASK_DOCUMENTS, customerDetails) },
        ]
    };
    const closingCategory = {
        display_name: 'Closing',
        templates: [
            { content: compileTemplate(CLOSING_ASK_REVIEW, customerDetails) },
        ]
    };

    // Respond with compiled Templates
    res.send([openersCategory, repliesCategory, closingCategory]);
};

// -----------------------------------------------------------------------------
// Add parameters into message templates.
//
const compileTemplate = (template, customer) => {
    let compiledTemplate = template;
    //
    compiledTemplate = compiledTemplate.replace(/{{Name}}/, customer.display_name);
    compiledTemplate = compiledTemplate.replace(/{{Author}}/, customer.worker);
    //
    // Added for Sandbox templates:
    compiledTemplate = compiledTemplate.replace(/{{CompanyName}}/, customer.company_name);
    compiledTemplate = compiledTemplate.replace(/{{Code}}/, getRndInteger(100000, 999999)); // 6 digit random number.
    //
    return compiledTemplate;
};

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// -----------------------------------------------------------------------------
// Message templates
//
const OPENER_NEXT_STEPS = 'Hello {{Name}} we have now processed your documents and would like to move you on to the next step. Drop me a message. {{Author}}.';
const OPENER_NEW_PRODUCT = 'Hello {{Name}} we have a new product out which may be of interest to your business. Drop me a message. {{Author}}.';
const OPENER_ON_MY_WAY ='Just to confirm I am on my way to your office. {{Name}}.';

const REPLY_SENT = 'This has now been sent. {{Author}}.';
const REPLY_RATES = 'Our rates for any loan are 20% or 30% over $30,000. You can read more at https://example.com. {{Author}}.';
const REPLY_OMW = 'Just to confirm I am on my way to your office. {{Author}}.';
const REPLY_OPTIONS = 'Would you like me to go over some options with you {{Name}}? {{Author}}.';
const REPLY_ASK_DOCUMENTS = 'We have a secure drop box for documents. Can you attach and upload them here: https://example.com. {{Author}}';

const CLOSING_ASK_REVIEW = 'Happy to help, {{Name}}. If you have a moment could you leave a review about our interaction at this link: https://example.com. {{Author}}.';

// -----------------------------------
// Twilio WhatsApp Sandbox templates
//
const SANDBOX_TEMPLATE_1 ='Your {{CompanyName}} code is {{Code}}.';
//          Example: Your Twilio code is 1238432
//      Your appointment is coming up on {{1}} at {{2}}
//          Example: Your appointment is coming up on July 21 at 3PM
//      Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}. Details: {{4}}
//          Example: Your Yummy Cupcakes Company order of 1 dozen frosted cupcakes has shipped and should be delivered on July 10, 2019. Details: http://www.yummycupcakes.com/
//      
module.exports = templatesCallbackHandler;
