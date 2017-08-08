const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');
// User Schema
const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    required: true
  },
  permission: [{
    action: String,
    appliedTo: String
  }],
  facebook: {
    id: String,
  },
  google: {
    id: String
  },
  avatar: {
    path_social: String,
    local: {
        image: [{
            path_local: String,
            typeImage: String
        }],
        displayImageID: String
    },
    displayImageType: String
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

const User = module.exports = mongoose.model('User' , UserSchema , 'User');
const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports.validateUser = function(user){
  if(user.name == undefined || user.email == undefined || user.username == undefined || user.password == undefined) return false;
  return re.test(user.email);
}

module.exports.saveUser = function(newUser, callback) {
    newUser.save(callback);
}

module.exports.isEmail = function(email){
  return re.test(email);
}

module.exports.createUser = function(newUser, callback){
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save(callback);
    });
  });
}

module.exports.getAllUser = function(query,callback){
	User.find(query,callback);
}

module.exports.correctUser = function(query,correctUser,callback){
	User.update(query,correctUser,callback);
}

module.exports.deleteUser = function(id,callback){
	var query = {_id: id};
	User.remove(query,callback);
}

module.exports.getUser = function(query, callback){
  User.findOne(query, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if(err) throw err;
    callback(null, isMatch);
  });
}
