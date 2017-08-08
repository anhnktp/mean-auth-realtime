const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const configDatabase = require('../config/database');
const configAuth = require('../config/auth');
const qs = require('querystring');
const request = require('request');
const User = require('../models/user');
const auth = require('../models/auth');
const async = require('async');

//register
router.post('/register', (req, res) => {
  async.waterfall([
    function(done){
      req.body.role = 'Normal User';
      auth.updatePermission(req.body, (err, user) => {
        done(err,user);
      })
    },
    function(user,done){
      if (!User.validateUser(user)) return res.json({success:false, msg: 'Invalid user !'})
      User.getUser({ $or: [{ username: user.username},{ email: user.email }]}, (err, docs) => {
        if (docs) {
          if (docs.username == user.username) return res.json({success: false, msg: 'Username existed, please enter another one !'});
          if (docs.email == user.email) return res.json({success: false, msg: 'Email existed, please enter another one !'});
        }
        done(err,user);
      })
    },
    function(user,done){
      newUser = new User({
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          permission: user.permission,
          password: user.password,
          avatar: {
              path_social: '',
              local: {
                  image: [{
                      path_local: 'uploads/default.jpg',
                      typeImage: 'image/jpg'
                  }],
                  displayImageID: ''
              },
              displayImageType: 'local'
          }
      });
      User.createUser(newUser, (err,docs) =>{
        if (err) return res.json({success: false, msg:'Failed to register user !'});
        User.correctUser({ _id: docs._id }, {'avatar.local.displayImageID': docs.avatar.local.image[0]._id }, (err) => {
            if (err) throw err;
            return res.json({success: true, msg:'User registered successfully !'});
        })
      })
    }
  ])
});

// Login
router.post('/login', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username == undefined || password == undefined) return res.json({success: false, msg: 'Please fill in all field !'});
  User.getUser({$or: [{username: username},{email: username}]}, (err, user) => {
    if (err) next(err);
    if (!user) return res.json({success: false, msg: 'User not exist !'});
    User.comparePassword(password, user.password, (err, isMatch) => {
      if(err) next(err);
      if (!isMatch) return res.json({success: false, msg: 'Wrong password'});
      let newToken = jwt.sign(user, configDatabase.secret, {expiresIn: 604800}); //1 week
      return res.json({success: true,
                       token: 'JWT ' + newToken,
                       user: {
                         _id: user._id,
                         name: user.name,
                         username: user.username,
                         email: user.email,
                         role: user.role
                       }
              });
    });
  });
});

router.post('/auth/facebook', function(req, res) {
    async.waterfall([
        function(done) {
            var accessTokenUrl = 'https://graph.facebook.com/v2.10/oauth/access_token';
            if (req.body.code) {
                var params = {
                    code: req.body.code,
                    client_id: configAuth.facebookAuth.clientID,
                    client_secret: configAuth.facebookAuth.clientSecret,
                    redirect_uri: configAuth.facebookAuth.callbackURL
                };
                request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
                    if (response.statusCode !== 200) {
                        return res.status(500).send({ message: accessToken.error.message });
                    }
                    done(err, accessToken)
                })
            } else {
                done(null, req.body.accessToken)
            }
        },
        function(accessToken, done) {
            var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name', 'picture.type(large)'];
            var graphApiUrl = 'https://graph.facebook.com/v2.9/me?fields=' + fields.join(',');
            request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
                if (response.statusCode !== 200) {
                    return res.status(500).send({ message: profile.error.message });
                }
                done(err, profile);
            })
        },
        function(profile, done) {
            User.findOne({ 'facebook.id': profile.id }, function(err, existingUser) {
                if (existingUser) {
                    let existUser = true;
                    done(err, existingUser, profile, existUser)
                }
                if (!existingUser) {
                    let existUser = false
                    done(err, null, profile, existUser)
                }
            })
        },
        function(existingUser, profile, existUser, done) {
            if (existUser == true) {
                var query_name_email = checkUpdateProfile(existingUser, profile);
                var query_avatar = {
                    'avatar.path_social': profile.picture.data.url
                }
                User.correctUser({ _id: existingUser._id }, Object.assign(query_name_email, query_avatar), function(err, result) {
                    var newToken = jwt.sign(existingUser, configDatabase.secret, { expiresIn: 604800 });
                    return res.send({
                        success: true,
                        token: 'JWT ' + newToken,
                        user: {
                            id: existingUser._id,
                            name: profile.name,
                            email: profile.email,
                            role: existingUser.role
                        }
                    });
                })
            }
            if (existUser == false) {
                let newUser = {
                    username: 'temp',
                    name: profile.name,
                    email: profile.email,
                    password: 'temp',
                    role: 'Normal User'
                }
                done(null, newUser, profile);
            }
        },
        function(newUser, profile, done) {
            auth.updatePermission(newUser, (err, user) => {
                var _user = new User(user);
                var finalUser = {
                    name: _user.name,
                    email: _user.email,
                    role: 'Normal User',
                    permission: _user.permission,
                    facebook: {
                        id: profile.id
                    },
                    avatar: {
                        path_social: profile.picture.data.url,
                        local: {
                            image: [{
                                path_local: 'uploads/default.jpg',
                                typeImage: 'image/jpg'
                            }],
                            displayImageID: ''
                        },
                        displayImageType: 'social'
                    }
                }
                done(null, finalUser)
            })
        },
        function(finalUser) {
          User.saveUser(new User(finalUser), (err, user) => {
                  User.correctUser({ _id: user._id }, { 'avatar.local.displayImageID': user.avatar.local.image[0]._id }, (err) => {
                      if (err) throw err;
                      var newToken = jwt.sign(user, configDatabase.secret, {
                          expiresIn: 604800 // 1 week
                      });
                      res.send({
                          success: true,
                          token: 'JWT ' + newToken,
                          user: {
                              _id: user._id,
                              name: user.name,
                              email: user.email,
                              role: user.role,
                          }
                      });
                  })

              })
        }
    ])
})

router.post('/auth/google', function(req, res) {
    async.waterfall([
        function(done) {
            var accessTokenUrl = 'https://www.googleapis.com/oauth2/v4/token';
            if (req.body.code) {
                var params = {
                    code: req.body.code,
                    client_id: configAuth.googleAuth.clientID,
                    client_secret: configAuth.googleAuth.clientSecret,
                    redirect_uri: configAuth.googleAuth.callbackURL,
                    grant_type: 'authorization_code'
                };
                let body = qs.stringify(params);
                request.post(accessTokenUrl, { body: body, headers: { 'Content-type': 'application/x-www-form-urlencoded' } }, function(err, response, token) {
                    if (response.statusCode !== 200) {
                        return res.status(500).send({ message: accessToken.error.message });
                    }
                    done(err, JSON.parse(token))
                })
            } else {
                done(null, JSON.stringify(req.body.accessToken))
            }
        },
        function(token, done) {
            var peopleApiUrl = 'https://www.googleapis.com/oauth2/v3/userinfo'; // userinfo_endpoint
            var accessToken = token.access_token;
            var headers = { Authorization: 'Bearer ' + accessToken };
            // Retrieve profile information about the current user.
            request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
                if (profile.error) {
                    return res.status(500).send({ message: profile.error.message });
                }
                done(err, profile)
            })
        },
        function(profile, done) {
            User.findOne({ 'google.id': profile.sub }, function(err, existingUser) {
                if (existingUser) {
                  let existUser = true;
                  done(err, existingUser, profile, existUser)
                }
                if (!existingUser) {
                  let existUser = false
                  done(err, null, profile, existUser)
                }
            })
        },
        function(existingUser, profile, existUser, done) {
            if (existUser == true) {
                var query_name_email = checkUpdateProfile(existingUser, profile);
                var query_avatar = {
                    'avatar.path_social': profile.picture
                }
                User.correctUser({ _id: existingUser._id }, Object.assign(query_name_email, query_avatar), function(err, result) {
                    var newToken = jwt.sign(existingUser, configDatabase.secret, { expiresIn: 604800 });
                    return res.send({
                        success: true,
                        token: 'JWT ' + newToken,
                        user: {
                            id: existingUser._id,
                            name: profile.name,
                            email: profile.email,
                            role: existingUser.role
                        }
                    });
                })
            }
            if (existUser == false) {
                let newUser = {
                    username: 'temp',
                    name: profile.name,
                    email: profile.email,
                    password: 'temp',
                    role: 'Normal User'
                }
                done(null, newUser, profile);
            }
        },
        function(newUser, profile, done) {
            auth.updatePermission(newUser, (err,user) => {
              var _user = new User(user);
              var finalUser = {
                  name: _user.name,
                  email: _user.email,
                  role: 'Normal User',
                  permission: _user.permission,
                  google: {
                      id: profile.sub
                  },
                  avatar: {
                      path_social: profile.picture,
                      local: {
                          image: [{
                              path_local: 'uploads/default.jpg',
                              typeImage: 'image/jpg'
                          }],
                          displayImageID: ''
                      },
                      displayImageType: 'social'
                  }
              }
              done(null, finalUser)
            })
        },
        function(finalUser) {
          User.saveUser(new User(finalUser), (err, user) => {
              User.correctUser({ _id: user._id }, { 'avatar.local.displayImageID': user.avatar.local.image[0]._id }, (err) => {
                  if (err) throw err;
                  var newToken = jwt.sign(user, configDatabase.secret, {
                      expiresIn: 604800 // 1 week
                  });
                  res.send({
                      success: true,
                      token: 'JWT ' + newToken,
                      user: {
                          _id: user._id,
                          name: user.name,
                          email: user.email,
                          role: user.role
                      }
                  });
              })

          })
        }
    ])
})

function checkUpdateProfile(localUser, profile) {
    if (localUser.name == profile.name && localUser.email == profile.email) {
        return {
            name: profile.name,
            email: profile.email
        }
    } else {
        return {}
    }
}

module.exports = router;
