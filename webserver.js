// -----------------------------------------------------------------------------
// Chat web server
// 
// Easy to use.
// 
// Install modules.
//  $ npm install --save express
//  
// Run the web server. Default port is hardcoded to 8000.
//  $ node websever.js
// 
// -----------------------------------------------------------------------------
// Setup to generate chat tokens.
// 
// Create environment variables which are used in the generateToken() function.
//
var ACCOUNT_SID = process.env.MASTER_ACCOUNT_SID;
//
// Create a Chat Service:
//  https://www.twilio.com/console/chat/dashboard
var CONVERSATIONS_SERVICE_SID = process.env.CONVERSATIONS_SERVICE_SID;
//
// Create an API key and secret string:
//  https://www.twilio.com/console/chat/runtime/api-keys
var API_KEY = process.env.API_KEY;
var API_KEY_SECRET = process.env.API_KEY_SECRET;

// -----------------------------------------------------------------------------
console.log("+++ Chat program is starting up.");

// -----------------------------------------------------------------------------
var returnMessage = '';
function sayMessage(message) {
    returnMessage = returnMessage + message + "<br>";
    console.log(message);
}

// -----------------------------------------------------------------------------
function generateToken(theIdentity) {
    // Documentation: https://www.twilio.com/docs/iam/access-tokens
    //
    if (theIdentity === "") {
        console.log("- Required: user identity for creating a Conversations token.");
        return "";
    }
    sayMessage("+ Generate token, Conversations participants ID: " + theIdentity);
    const AccessToken = require('twilio').jwt.AccessToken;
    const token = new AccessToken(
            ACCOUNT_SID,
            API_KEY,
            API_KEY_SECRET
            );
    // Create a service: https://www.twilio.com/console/conversations/services
    const chatGrant = new AccessToken.ChatGrant({
        serviceSid: CONVERSATIONS_SERVICE_SID
    });
    token.addGrant(chatGrant);
    token.identity = theIdentity;
    token.ttl = 1200;          // Token time to live, in seconds. 1200 = 20 minutes.
    //
    // Output the token.
    theToken = token.toJwt();
    // console.log("+ theToken " + theToken);
    return(theToken);
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Web server interface to call functions.
// -----------------------------------------------------------------------------
// 
// $ npm install express --save
const express = require('express');
const path = require('path');
const url = require("url");
const PORT = process.env.PORT || 8000;
var app = express();

// -----------------------------------------------------------------------------
app.get('/generateToken', function (req, res) {
    sayMessage("+ Generate Conversations Token.");
    if (req.query.identity) {
        res.send(generateToken(req.query.identity));
    } else {
        sayMessage("- Parameter required: identity.");
        res.send(0);
    }
});

// -----------------------------------------------------------------------------
app.get('/hello', function (req, res) {
    res.send('+ hello there.');
});
// -----------------------------------------------------------------------------
app.use(express.static('docroot'));
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('HTTP Error 500.');
});
app.listen(PORT, function () {
    console.log('+ Listening on port: ' + PORT);
});
