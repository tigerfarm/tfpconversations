// The Twilio account values are either retrieved from .env file or from environment variables.
// I use .env file on my localhost.
// I use environment variables on Heroku. Heroku overrides the PORT setting.
//
require('dotenv').config();
const _ = (varName, defaults) => process.env[varName] || defaults || null;
const port = _('PORT', 5000);
module.exports = {
    port: port,
    twilio: {
        account_sid: _('TWILIO_ACCOUNT_SID'),
        auth_token: _('TWILIO_AUTH_TOKEN'),
        sso_realm_sid: _('TWILIO_SSO_REALM_SID'),
        sms_number: _('TWILIO_SMS_NUMBER'),
        whatsapp_number: _('TWILIO_WHATSAPP_NUMBER')
    },
};
