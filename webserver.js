// -----------------------------------------------------------------------------
// Conversations chat web server
// 
// Easy to use.
// Install modules.
//  $ npm install --save express
//  $ npm install --save twilio
//  
// Run the web server. Default port is hardcoded to 8000.
//  $ node websever.js
// 
// -----------------------------------------------------------------------------
console.log("+++ Conversations application web server is starting up.");
// -----------------------------------------------------------------------------
// Setup to generate chat tokens.
// 
// Create environment variables which are used in the generateToken() function.
//
var ACCOUNT_SID = process.env.CONVERSATIONS_ACCOUNT_SID;
//
// Create a Chat Service:
//  https://www.twilio.com/console/chat/dashboard
var CONVERSATIONS_SERVICE_SID = process.env.CONVERSATIONS_SERVICE_SID;
var FCM_CREDENTIAL_SID = process.env.FCM_CREDENTIAL_SID;
console.log("+ CONVERSATIONS_SERVICE_SID: " + CONVERSATIONS_SERVICE_SID);
console.log("+ FCM_CREDENTIAL_SID :" + FCM_CREDENTIAL_SID + ":");
//
// Create an API key and secret string:
//  https://www.twilio.com/console/chat/runtime/api-keys
var API_KEY = process.env.CONVERSATIONS_API_KEY;
var API_KEY_SECRET = process.env.CONVERSATIONS_API_KEY_SECRET;
// -----------------------------------------------------------------------------
var client = require('twilio')(process.env.CONVERSATIONS_ACCOUNT_SID, process.env.CONVERSATIONS_ACCOUNT_AUTH_TOKEN);
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
    let chatGrant;
    if (FCM_CREDENTIAL_SID) {
        chatGrant = new AccessToken.ChatGrant({
            serviceSid: CONVERSATIONS_SERVICE_SID,
            pushCredentialSid: FCM_CREDENTIAL_SID   // For web application notifications
        });
    } else {
        chatGrant = new AccessToken.ChatGrant({
            serviceSid: CONVERSATIONS_SERVICE_SID
        });
    }
    token.addGrant(chatGrant);
    token.identity = theIdentity;
    // token.ttl = 1200; // Token time to live, in seconds. 1200 = 20 minutes.
    // token.ttl = 600; // Token time to live, in seconds. 600 = 5 minutes. For testing token update.
    token.ttl = 28800; // Token time to live, in seconds. 28800 = 8 hours
    //
    // Output the token.
    theToken = token.toJwt();
    // console.log("+ theToken " + theToken);
    return(theToken);
}

// -----------------------------------------------------------------------------
function addParticipantToConversation(res, conversationId, participantIdentity) {
    sayMessage("+ Add the participant: " + participantIdentity + ", into conversationId: " + conversationId);
    client.conversations.services(CONVERSATIONS_SERVICE_SID).conversations(conversationId)
            .participants
            .create({
                identity: participantIdentity,
                attributes: JSON.stringify({name: participantIdentity})
            })
            .then(participant => {
                console.log("+ Participant added into the conversation, participant SID: " + participant.sid);
                res.send("1");
            }).catch(function (err) {
        if (err.toString().indexOf('Participant already exists') > 0) {
            console.log("+ Participant already exists.");
            res.send("0");
        } else if (err) {
// If the conversation does not exist:
// - Error: The requested resource /Services/IS4ebcc2d46cda47958628e59af9e53e55/Conversations/abc6/Participants was not found
            console.error("- " + err);
            res.send("-2");
        }
    });
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

// When deploying to Heroku, must use the keyword, "PORT".
// This allows Heroku to override the value and use port 80. And when running locally can use other ports.
const PORT = process.env.PORT || 8000;

var app = express();
// -----------------------------------------------------------------------------
app.get('/generateToken', function (req, res) {
    sayMessage("+ Generate Conversations Token.");
    if (req.query.identity) {
        res.send(generateToken(req.query.identity));
    } else {
        sayMessage("- Parameter required: identity.");
        res.sendStatus(502);
    }
});
// -----------------------------------------------------------------------------
app.get('/listConversations', function (req, res) {
    sayMessage("+ Get list of conversations.");
    var theResult = "";
    var acounter = 0;
    client.conversations.services(CONVERSATIONS_SERVICE_SID).conversations.list({limit: 200})
            .then(conversations => {
                conversations.forEach(c => {
                    acounter++;
                    console.log(
                            "+ Conversations SID/friendlyName: " + c.sid
                            + "/" + c.friendlyName
                            );
                    theResult = theResult
                            + c.sid + " "
                            + c.friendlyName + "\n";
                });
                res.send(theResult + "\n+ Total count = " + acounter);
                console.log("+ Total count = " + acounter);
            });
});
// -----------------------------------------------------------------------------
app.get('/listConversationParticipants', function (req, res) {
    sayMessage("+ Get list of participants in a conversation.");
    if (req.query.conversationSid) {
        conversationSid = req.query.conversationSid;
        sayMessage("- Parameter conversationSid: " + conversationSid);
    } else {
        sayMessage("- Parameter required: conversationSid.");
        res.sendStatus(502);
        return;
    }
    var theResult = "";
    client.conversations.services(CONVERSATIONS_SERVICE_SID).conversations(conversationSid).participants.list({limit: 20})
            .then(participants => {
                participants.forEach(p => {
                    if (p.identity !== null) {
                        console.log("+ Participant SID: " + p.sid + " identity, Chat: " + p.identity);
                        theResult = theResult
                                + p.sid
                                + " Chat:" + p.identity + "\n";
                    } else {
                        console.log("+ Participant SID: " + p.sid + " identity, SMS:  " + JSON.parse(p.attributes).name);
                        theResult = theResult
                                + p.sid
                                + " SMS:  " + JSON.parse(p.attributes).name + "\n";
                    }
                });
                res.send(theResult);
            });
});

// -----------------------------------------------------------------------------
app.get('/conversationExists', function (req, res) {
    // localhost:8000/conversationExists?conversationid=abc
    sayMessage("+ Check if conversation exists.");
    if (req.query.conversationid) {
        conversationId = req.query.conversationid;
        sayMessage("+ Parameter conversationId: " + conversationId);
        //
        // Determine if the conversation exists.
        client.conversations.services(CONVERSATIONS_SERVICE_SID).conversations(conversationId)
                .fetch()
                .then(conversation => {
                    console.log(
                            "+ Conversation exits, SID: " + conversation.sid
                            + " " + conversation.uniqueName
                            + " " + conversation.friendlyName
                            );
                    res.send("1");
                })
                .catch(function (err) {
                    console.log("+ Conversation does NOT exist.");
                    res.send("0");
                });
    } else {
        sayMessage("- Parameter required: conversationid.");
        res.status(400).send('HTTP Error 400. Parameter required: conversationid.');
    }
});

// -----------------------------------------------------------------------------
app.get('/removeConversation', function (req, res) {
    if (req.query.conversationid) {
        conversationId = req.query.conversationid;
        sayMessage("+ Remove the conversation: " + conversationId);
        client.conversations.services(CONVERSATIONS_SERVICE_SID).conversations(conversationId).remove()
                .then(conversations => {
                    console.log("++ Removed.");
                    res.send("0");
                })
                .catch(function (err) {
                    console.log("-- Conversation does NOT exit, not removed.");
                    res.send("-2");
                });
    } else {
        sayMessage("- Parameter required: conversationid.");
        res.status(400).send('HTTP Error 400. Parameter required: conversationid.');
    }
});

// -----------------------------------------------------------------------------
app.get('/joinConversation', function (req, res) {
    // Can join a conversation using either the SID or unique name.
    // localhost:8000/joinConversation?identity=dave3&conversationid=CH52652cb27e81490bbb5cc67c223b857a
    // localhost:8000/joinConversation?identity=dave3&conversationid=abc
    sayMessage("+ Join a participant into a conversation.");
    if (req.query.identity) {
        if (req.query.conversationid) {
            participantIdentity = req.query.identity;
            conversationId = req.query.conversationid;
            sayMessage("+ Parameter identity: " + participantIdentity + ", conversationId: " + conversationId);
            //
            // Determine if the conversation exists.
            client.conversations.services(CONVERSATIONS_SERVICE_SID).conversations(conversationId)
                    .fetch()
                    .then(conversation => {
                        console.log(
                                "+ Conversation exits, SID: " + conversation.sid
                                + " " + conversation.uniqueName
                                + " " + conversation.friendlyName
                                );
                        addParticipantToConversation(res, conversationId, participantIdentity);
                    })
                    .catch(function (err) {
                        console.log("+ Conversation does NOT exist, cannot join it.");
                    });
        } else {
            sayMessage("- Parameter required: conversationid.");
            res.status(400).send('HTTP Error 400. Parameter required: conversationid.');
        }
    } else {
        sayMessage("- Parameter required: identity.");
        res.status(400).send('HTTP Error 400. Parameter required: identity.');
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
