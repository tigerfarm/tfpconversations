# Frontline Integration Service Sample

This README is for creating and managing the repository and Heroku application.

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
