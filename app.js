var express = require('express');
var request = require('request');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const { response } = require('express');
const url = require('url');
const cheerio = require('cheerio');

var client_id = '';
var client_secret = '';
var redirect_uri = 'http://localhost:3002/authCallback';

let token = '';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.json());
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  var scope = 'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/authCallback', function(req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        var refresh_token = body.refresh_token;

        token = access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        request.get(options, function(error, response, body) {
          console.log(body);
        });

        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/me', function(req, res) {
  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };
  request.get(options, function(error, response, body) {
    res.json(response);
  });
})

app.get('/refresh_token', function(req, res) {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/artists/:timeRange', function(req, res) {
  const timeRange = req.params.timeRange;
  fetch('https://api.spotify.com/v1/me/top/artists?time_range=' + timeRange, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  })
  .then(resp => resp.json())
  .then(data => {
    res.json(data);
  }).catch(err => console.log(err));
});

app.get('/tracks/:timeRange', function(req, res) {
  const timeRange = req.params.timeRange;
  fetch('https://api.spotify.com/v1/me/top/tracks?time_range=' + timeRange, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  })
  .then(resp => resp.json())
  .then(data => {
    res.json(data);
  }).catch(err => console.log(err));
});

app.get('/getTracks', function(req, res) {
  const showLink = req.query.url;
  request(showLink, function(
    error, 
    response,
    body
  ) {
    let tracks = GetTracksFromBody(body);
    res.json(tracks);
  });
});

app.get('/search/:q', function(req, res) {
  const q = req.params.q;
  console.log(q);
  fetch('https://api.spotify.com/v1/search?q=' + encodeURI(q) + '&type=track', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  })
  .then(resp => resp.json())
  .then(data => {
    res.json(data);
  });
});

app.post('/createPlaylist/:user', function(req, res) {
  const user = req.params.user;
  fetch('https://api.spotify.com/v1/users/' + user + '/playlists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      "name": req.body.playlist.title,
      "description": req.body.playlist.desc,
      "public": req.body.playlist.publicPrivate
    })
  }).then(resp => resp.json())
    .then(data => {
      res.json(data);
    })
});

app.post('/addToPlaylist/:playlistID/:trackID', function(req, res) {
  const playlistID = req.params.playlistID;
  const trackID = req.params.trackID;
  fetch('https://api.spotify.com/v1/playlists/' + playlistID + '/tracks?uris=' + encodeURI('spotify:track:') + trackID, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
  }).then(resp => resp.json())
  .then(data => {
    res.json(data);
  })
});

function GetTracksFromBody(body) {
  let tracks = [];
  const $ = cheerio.load(body);
  const searchResults = $('track').find('')
  $('body').find('.track').map((i, el) => {
    let title = $(el).find('.track__title').first().text();
    let artist = $(el).find('.track__artist').first().text();
    tracks.push({'title': title, 'artist': artist});
  });
  return tracks;
}

console.log('Listening on 3002...');
app.listen(3002);
