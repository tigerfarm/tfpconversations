# Twilio Conversations Web Application

This Conversations web application is a developer/training application that is ready to run. 

Client Application screen print:

<img src="clientapp.jpg" width="400"/>

Sample usage sequence:
+ After loading the client in your browser, 
click List conversations to view the conversations in the Twilio Conversations service.
This makes a server side call to list all conversations.
All server side calls(HTTP requests) are handle in: [webserver.js](webserver.js).
+ Enter an identity to use in the creation of your token(server side call).
Click Create Client to create a Conversations client object.
Current joined conversations are listed.
+ Enter a conversation name a click Join.
You will be added into the conversation.
If it's a new conversation it will be created.
You will be added into the conversation, if you are not already in the conversation.
+ Click Messages to get a list of messages currently in the conversation.
+ Enter a text message in the field above the buttons.
Hit the enter key, or click Send, to send the message.
The message will be displayed.
+ Optionally, click Delete to delete the conversation.
Known bug, the conversation stays in the participant's list of joined conversations.
Refresh the page to reuse the same conversation name.
+ Open another browser tab and load the client.
Enter a new identity, enter the same room as the other client, and chat.

### Implementation Requirements:

You will need a Twilio account. A free Trial account will work.
To run locally on your computer install and test Node.JS.

Install the Twilio SDK helper library and Express.
Express for running the Node web servers.
````
$ npm install twilio
$ npm install express
````

To run the application,
+ Set configurations using the Twilio Console,
+ Add environment variables (see following), 
and your ready to run it on your local server that has Node.js installed.

Before running from command line, add the following as environment variables.
Create the variables where required.
+ CONVERSATIONS_ACCOUNT_SID : your Twilio account SID (starts with "AC", available from Twilio Console)
+ CONVERSATIONS_ACCOUNT_AUTH_TOKEN : Your Twilio account auth token
+ CONVERSATIONS_API_KEY : one of your Twilio API keys
+ CONVERSATIONS_API_KEY_SECRET : the matching API key secret string
+ CONVERSATIONS_SERVICE_SID : your Conversations service SID (starts with IS).
+ CONVERSATIONS_MESSAGING_SERVICE_SID : Conversation service Messaging Service SID.
+ PORT : optional, web server port. When running on a local server, default port is 8000.

Download this repository's zip into a working directory and unzip it.

To run:
````
$ node webserver.js 
+++ Conversations application web server is starting up.
+ Listening on port: 8000
...
````
Or using:
````
$ npm start
> tfpconversations@1.2.1 start
> node webserver.js
+++ Conversations application web server is starting up.
+ Listening on port: 8000
...
````

## Files

- [docroot/index.html](docroot/index.html) : Client HTML
- [docroot/conversations.js](docroot/conversations.js) : Client JavaScript
- [docroot/custom/chat.css](docroot/custom/chat.css) : Chat client styles, CSS
- [webserver.js](webserver.js) : a NodeJS Express HTTP Server that serves the client files.
- [app.json](app.json) : Heroku deployment file to describe the application.
- [package.json](package.json) : Heroku deployment file which sets the programming language used.

## Twilio Console Configuration

These are the steps to configure to use the Chat Web Application.
No development or credit card information required to try Chat.

1. Create a Conversations Service:

[https://www.twilio.com/console/conversations/dashboard](https://www.twilio.com/console/conversations/dashboard)

2. Create an API key and secret string:

[https://www.twilio.com/console/dashboard/runtime/api-keys](https://www.twilio.com/console/dashboard/runtime/api-keys)

--------------------------------------------------------------------------------
Cheers...
