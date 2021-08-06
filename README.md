# Twilio Conversations Web Application

This Conversations web application is a developer/training application that is ready to run. 

Client Application screen print:

<img src="clientapp.jpg" width="400"/>

Sample usage sequence:
+ After loading the client in your browser, 
click List conversations to view the conversations in the Twilio Conversations service.
This makes a server side call to list all conversations.
+ Enter an identity to use in the creation of your token.
Click Create Client to create a Conversations client object.
Current joined conversations are listed.
+ Enter a conversation name a click Join.
You will be added into the conversation.
If it's a new conversation it will be created.
Else, you will be added in, if you are not already in the conversation.
+ Click Messages to get a list of messages currently in the conversation.
+ Enter a text message in the field above the buttons.
Hit the enter key, or click Send, to send the message.
The message will be displayed: <Identity> : <conversation> : <Message text>
+ Optionally, click Delete to delete the conversation.
None bug, the conversation stays in the participant's list of joined conversations.
Refresh the page to reuse the same conversation name.
+ Open another browser tab and load the client.
Enter a new identity, enter the same room and the other client, and chat.

### Requirements:

+ Twilio account. A free Trial account will work.
+ To run locally on your computer using the include web server, install Node.JS, the Twilio Node.JS helper library, 
    and Node express.

Install the Twilio SDK helper library. Install Node Express for running Node web servers.
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

Run:
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
- [docroot/chat.js](docroot/chat.js) : Client JavaScript
- [docroot/custom/chat.css](docroot/custom/chat.css) : Chat client styles, CSS

- [webserver.js](webserver.js) : a NodeJS Express HTTP Server that serves the Chat client files.
- [chatcli.js](chatcli.js) : a standalone NodeJS command line chat program.

- [app.json](app.json) : Heroku deployment file to describe the application.
- [package.json](package.json) : Heroku deployment file which sets the programming language used.

## Twilio Console Configuration

These are the steps to configure to use the Chat Web Application.
No development or credit card information required to try Chat.

1. Create a Chat Service:

[https://www.twilio.com/console/chat/dashboard](https://www.twilio.com/console/chat/dashboard)

2. Create an API key and secret string:

[https://www.twilio.com/console/chat/runtime/api-keys](https://www.twilio.com/console/chat/runtime/api-keys)

--------------------------------------------------------------------------------
## For Developers

Following are the steps to run the Chat Web Application on your localhost computer.

Download this repository's zip into a working directory and unzip it.
Create an environment variable that is your Twilio Function Runtime Domain.
Example:
````
$ export ACCOUNT_SID ACxxx...xxx
$ export CHAT_SERVICE_SID ISxxx...xxx
$ export CHAT_API_KEY SKxxx...xxx
$ export CHAT_API_KEY_SECRET xxx...xxx
````
Run the Node.JS server program, install the required packages, then run the chat server or command line program.
````
$ npm install twilio
$ npm install twilio-chat
$ npm install express

$ node webserver.js
````
### Test the Chat Web Server
````
Use your browser to run the chat client:
http://localhost:8000
Enter a username, example: stacy.
Enter a Channel name and description, example: "mychannel" and "My test channel".

In another browser tab, run another chat client using a , same channel name:
http://localhost:8000
Enter a username, example: david (different username).
Enter a Channel name, example: mychannel (same as the other client).

Send messages between your clients.
````
--------------------------------------------------------------------------------
Cheers...
