# Frontline Integration Service Sample

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/tigerfarm/tfpfrontlinejson)

[Documentation](https://github.com/tigerfarm/work/tree/master/book/Frontline).

## Using Heroku with my sample application

Daily Heroku authentication.
````
$ heroku login
heroku: Press any key to open up the browser to login or q to exit: 
Opening browser to https://cli-auth.heroku.com/auth/cli/browser/cd...i0
Logging in... done
Logged in as t...@gmail.com
````

Initialize to deploy to Heroku.
````
$ heroku git:remote -a tfpfrontline
````

After initialization, the following will update the GitHub repository and
deploy/redeploy the Heroku application.
````
$ git add .
$ git commit -am "update"
$ git push -u origin main

$ git push heroku main
````
## Using Frontline with the Twilio WhatsApp Sandbox

I setup my Frontline system to use the Twilio WhatsApp Sandbox.

Results of my testing:
+ In the Frontline app, I cannot send a first message because my account doesn’t have any templates, and Frontline app does not pickup the Twilio WhatsApp Sandbox templates for me to use.
+ I can use a program(I use curl) to send template messages to my WhatsApp user.
+ In my WhatsApp user app, I can receive and read messages from my program.
+ In my WhatsApp user app, I can send messages to my Frontline user.
+ In my Frontline app, I can receive and read messages from my WhatsApp user.
+ In my Frontline app, I can reply to the received messages from my WhatsApp user.
+ In my WhatsApp user app, I can receive and read messages from my Frontline user.

Sending WhatsApp messages to a WhatsApp user, from the Twilio WhatsApp Sandbox sender id.
````
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$MASTER_ACCOUNT_SID/Messages.json \
--data-urlencode 'To=whatsapp:+16505552222' \
--data-urlencode 'From=whatsapp:+14155238886' \
--data-urlencode 'Body=Your Twilio code is 1234561' \
-u $MASTER_ACCOUNT_SID:$MASTER_AUTH_TOKEN
````

--------------------------------------------------------------------------------

Cheers...
