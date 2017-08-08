const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
const auth = require('../models/auth');
const config = require('../config/database');

module.exports.JWT = function(passport){
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = config.secret;

  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    let query ;
    if(jwt_payload._doc == undefined){
      query = {_id: jwt_payload._id}
    } else {
      query = {_id: jwt_payload._doc._id};
    }
    User.getUser(query, (err, user) => {
      if(err){
        return done(err, false);
      }

      if(user){
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  }));
}
