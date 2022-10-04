# Frontline Integration Service Sample

For Frontline, I'm using Twilio phone number: +12093308682.

To test:
````
Send a message from my phone to +12093308682.
Log into Frontline using:
+ Frontline workspace: owlpress.
+ Okta user login username:t...m@g...m/New-regular-password.
In the Frontline app, after logging in,
  Tap My Conversations/Dave Here, to view the received message.
Can send a reply.
````
For a list of Frontline customers, including Dave Here,
+ Open the file: [src/providers/customer.js](src/providers/customer.js)
+ The "worker" attribute matches the Okta user login id.

Dave Here's data in customer.js
````
    {
        customer_id: 33,
        display_name: 'Dave here',
        company_name: 'Poets Inc',
        channels: [
            {type: 'sms', value: '+16504.....3'}
        ],
        worker: 't...m@g...m', // Okta Person username
        avatar: 'https://someassets-1403.twil.io/avatarMine1.jpg'
    }
````

[Frontline web application](https://frontline.twilio.com/login)

My Frontline [Setup and configurations](https://github.com/tigerfarm/work/tree/master/book/Frontline).

--------------------------------------------------------------------------------
### Once Setup, Using Okta Admin to Manage Frontline Worker Access

Log into [my Okta account](https://dev-29758280.okta.com/).
````
Applications/Applications, click your application: Owl Press
Under the "Assignments" option, left option "People", is the list your Okta users,
    "Persons" assigned to this application.
Click a Person.
Click Profile.
    You will see: User type/userType is "agent" (Configure Claims setting).

Under the "Sign On" option, is the SAML Signing Certificates information.
In the table, beside: SHA-1, click Actions and select View IdP MetaData.
    This will display the Frontline/Manage/SSO/Log in values,
        + Frontline Identity provider issuer URL (entityID attribute):
        http://www.okta.com/exk1n1udeluGBPNFs5d7exk1n1udeluGBPNFs5d7
        + Frontline SSO URL(SingleSignOnService attribute):
        https://dev-29758280.okta.com/app/dev-29758280_owlpress_1/exk1n1udeluGBPNFs5d7/sso/saml

Under the "General" option, is the Frontline SAML Settings,
    That include your Frontline JBxxx id.
    Table that should be:
Attribute Statements
Name    Name Format Value
email   Basic       user.email
roles   Basic       user.userType
````

How to Configure Okta as a Frontline Identity Provider
https://www.twilio.com/docs/frontline/sso/okta
````
1. Register a developer account at Okta
2. Create an application on Okta
3. Configure your Application (in Okta)
4. Configure Claims (in Okta)
5. Copy Application details: get information for Okta, to use in Twilio Frontline configurations.
6. Assign Users to the Application
7. Configure Frontline with your new SAML credentials: paste Okta information into your Twilio Frontline SSO configurations.
````

--------------------------------------------------------------------------------
### Creating and managing the repository and Heroku application.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/tigerfarm/tfpfrontlinejson)

[Documentation](https://github.com/tigerfarm/work/tree/master/book/Frontline).

[Frontline application](https://github.com/twilio/frontline-demo-service)
I've cloned and updated in this repository.

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

--------------------------------------------------------------------------------

Cheers...
