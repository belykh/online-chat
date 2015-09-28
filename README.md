# Online Chat

Single Page Application allows users to chat on the Internet

# Dependencies

- express - web framework for Node.js
- ejs - JavaScript templates
- ws - using WebSocket

# Deploing using [Heroku](https://heroku.com)

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```sh
$ git clone https://github.com/belykh/online-chat.git # or clone your own fork
$ cd online-chat
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```
$ git clone https://github.com/belykh/online-chat.git # or clone your own fork
$ cd online-chat
$ heroku create
$ git push heroku master
$ heroku open
```
