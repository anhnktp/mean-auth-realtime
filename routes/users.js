const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const authorization = require('./authorization');
const auth = require('../models/auth');
const multer = require('multer');
const fs = require('fs');

const smtpTransport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'anhnktp@gmail.com',
    pass: 'dieulinh'
  }
});

//reset password by user
router.get('/reset/:token' , (req, res, next) => {
  User.getUser({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (err) next(err);
    if (!user) return res.json({success: false, msg: "User not found !"});
    crypto.randomBytes(4, function(err, buf) {
      if (err) throw err
      var newPassword = buf.toString('hex');
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      User.createUser(user, (err) => {
        if (err) return res.json({success: false, msg: "Reset password failed !"});
        var mailOptions = {
          to: user.email,
          from: 'anhnktp@gmail.com',
          subject: 'Your password has been changed',
          text: 'Hello '+user.name+',\n\n' +
            'This is a confirmation email that you reset your password successfully.\n'+
            'Your new password:   '+ newPassword +
            '\nLet go to your profile and re-change this password !.\n'
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          if (err) return res.json({success: false, msg: "Server send email failed !"});
          return res.json({success: true, msg: "Server send email successfully !"});
        });
      })
    });
  });
});

//get list user by role on dashboard
router.get('/', passport.authenticate('jwt', {session:false}), (req, res) => {
  User.getAllUser({role: {$in: authorization.getAppliedToByAction(req.user,'read')}},(err, docs) => {
    if (err) return ({success:false, msg: "Failed to load all user !"});
    res.json({success: true, all: docs, profile: req.user});
  })
})

//get profile user
router.get('/profile', passport.authenticate('jwt', {session:false}) , (req, res) => {
  let arr_img = req.user.avatar.local.image
  for (let i = 0; i < arr_img.length; i++) {
    let path_local = arr_img[i].path_local;
    let typeImage = arr_img[i].typeImage;
    var base64Code = new Buffer(fs.readFileSync(path_local)).toString('base64');
    var prefix = 'data:' + typeImage + ';base64,';
    arr_img[i].path_local = prefix + base64Code;
  }
  res.json({
     username: req.user.username,
     name: req.user.name,
     role: req.user.role,
     email: req.user.email,
     avatar: {
         path_social: req.user.avatar.path_social,
         local: {
             image: arr_img,
             displayImageID: req.user.avatar.local.displayImageID
         },
         displayImageType: req.user.avatar.displayImageType
     },
     facebook: req.user.facebook,
     google: req.user.google
  });
});

//get user by id
router.get('/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
  User.getUser({_id: req.params.id}, (err, user) => {
    if (err) return res.json({success: false, msg:'Invalid request !'})
    if (!user) return res.json({success: false, msg:'User not exist !'});
    if (!authorization.authorUser(req.user,'read',user.role) && req.params.id != req.user._id) return res.json({success: false, msg: 'Unauthorized !'});
    return res.json({success: true, user: user});
  })
});

//UPLOAD IMAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,'./uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
})

router.post('/image', passport.authenticate('jwt', {session:false}), (req, res, next) => {
  var upload = multer({
    storage: storage,
    fileFilter: function(req, file, callback){
      var ext = path.extname(file.originalname);
      if (ext != '.png' && ext != '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        res.send({success: false , msg: 'Only images are allowed'})
        return callback(null,false);
      }
      callback(null,true)
    },
    limits: {
      fileSize: 1024000
    }
  }).any();
  upload(req, res, (err) => {
    if (err) {
      if (err.code == 'LIMIT_FILE_SIZE'){
        res.send({success: false , msg: 'Max size of image is 1 MB'});
      } else res.send({success:false, msg: err});
    }
    if(req.files[0] != undefined || null){
        let avatar = {
          path: req.files[0].path,
          typeImage: req.files[0].mimetype
        }
        User.correctUser({_id: req.user._id},{avatar: avatar},(err) => {
          if(err) throw err;
          var base64Code = new Buffer(fs.readFileSync(req.files[0].path)).toString('base64');
          let prefix = 'data:'+ req.files[0].mimetype +';base64,';
          res.json({success: true,base64ImageData: prefix + base64Code});
        })
      }
  })
})

//Add user
router.post('/', passport.authenticate('jwt', {session:false}), (req,res) => {
  if (!authorization.authorUser(req.user,'create','Normal User')) return res.json({success: false, msg: 'Unauthorized !'});
  async.waterfall([
    function(done){
      var arrRole = ['Admin','Manager','Normal User']
      if (!arrRole.includes(req.body.role) || req.user.role != 'Admin') req.body.role = 'Normal User';
      auth.updatePermission(req.body, (err, user) => {
        done(err,user);
      })
    },
    function(user, done){
      if (!User.validateUser(user)) return res.json({success:false, msg: 'Invalid user !'});
      User.getUser({$or: [{username: user.username},{email: user.email}]}, (err,docs) => {
        if (docs) {
          if (docs.username == user.username) return res.json({success: false, msg: 'Username existed, please enter another one !'});
          if (docs.email == user.email) return res.json({success: false, msg: 'Email existed, please enter another one !'});
        }
        done(err,user);
      })
    },
    function(user){
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
        if (err) return res.json({success: false, msg:'Failed to add new user !'});
        User.correctUser({ _id: docs._id }, {'avatar.local.displayImageID': docs.avatar.local.image[0]._id }, (err) => {
            if (err) throw err;
            return res.json({success: true, msg:'New user has been added !'});
        })
      })
    }
  ])
})

//check login by token and respond new token
router.post('/checklogin', (req, res, next) =>{
  var token = req.body.token;
  token = token.slice(4,token.length);
  try{
      var decoded = jwt.verify(token, config.secret);
      var expireTime = decoded.exp;
      if (expireTime*1000<=Date.now()) return res.json({success: false, msg:"Token Expired !"})
      User.getUser({_id: decoded._doc._id}, (err, user) => {
        if (err) next(err);
        if (!user) return res.json({success: false, msg:'Invalid token !'});
        let newToken = jwt.sign(user, config.secret, {expiresIn: 604800}); //1 week
        return res.json({success: true, token: 'JWT ' + newToken });
      });
  } catch(err) { return res.json({success: false, msg:"Invalid Token !"}); }
});

//forgot password and send email activate
router.post('/forgot', (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.getUser(req.body, (err, user) => {
        if (err) next(err);
        if (!user) return res.json({success: false, msg: 'Email not exist. Please enter an other one !'});
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      })
    },
    function(token, user) {
      var mailOptions = {
        to: user.email,
        from: 'anhnktp@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + 'localhost:3000' + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        if (err) return res.json({success: false, msg: "Server send email failed !"});
        return res.json({success: true, msg: "Server send email successfully !"});
      });
    }
  ]);
})

//check compare password
router.post('/check', passport.authenticate('jwt', {session:false}), (req, res, next) =>{
  User.comparePassword(req.body.password, req.user.password, (err, isMatch) => {
    if (err) next(err);
    if (!isMatch) return res.json({success: false});
    return res.json({success: true});
  });
})

// check exist
router.post('/exist', (req, res, next) =>{
  User.getUser(req.body, (err, user) => {
    if (err) next(err);
    if (!user) return res.json({success: true});
    return res.json({success:false})
  })
})

// CHINH SUA, XOA AVATAR PROFILE
router.put('/profile/avatar', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.body.editType == 'EDIT_CURRENT_AVATAR') {
        let query;
        if (req.body.displayImageType == 'social') {
            query = { 'avatar.displayImageType': req.body.displayImageType }
        }
        if (req.body.displayImageType == 'local') {
            query = { 'avatar.displayImageType': req.body.displayImageType, 'avatar.local.displayImageID': req.body.displayImageID };
        }
        User.correctUser({ _id: req.user._id }, query, function(err) {
            if (err) throw err;
            return res.json({ success: true, msg: 'successfully' });
        })
    }

    if (req.body.editType == 'DELETE_AVATAR') {
        let deleteImageID = req.body.deleteImageID
        User.correctUser({ _id: req.user._id }, { $pull: { 'avatar.local.image': { _id: deleteImageID } } }, (err, docs) => {
            console.log('result: ' + JSON.stringify(docs))
            if (err) throw err;
            return res.json({ success: true, msg: 'successfully' });
        })
    }
})
//update profile
router.put('/profile', passport.authenticate('jwt', {session:false}), (req, res, next) => {
  let correctUser = {
      name: req.body.name || req.user.name,
      email: req.body.email || req.user.email,
  };
  if (!User.isEmail(correctUser.email)) return res.json({success: false, msg: 'Invalid email !'});
  User.getUser({email: correctUser.email, username: {$nin: [req.user.username]}}, (err, docs) => {
    if (err) next(err);
    if (docs) return res.json({success: false , msg: 'Exist email, try another one !'});
    User.correctUser({_id: req.user._id}, correctUser, (err) => {
      if (err) return res.json({success: false, msg: 'Failed to update profile !'})
      return res.json({success: true, msg:'User has been updated !'});
    })
  })
});

//changePasswordUser
router.put('/password', passport.authenticate('jwt', {session:false}), (req, res, next) =>{
  User.getUser({_id: req.user.id}, (err,user) => {
    if (err) next(err);
    if (!user) return res.json({success: false});
    user.password = req.body.password;
    User.createUser(user, (err) => {
      if (err) return res.json({success: false});
      return res.json({success: true});
    })
  })
})

//update user by id
router.put('/:id', passport.authenticate('jwt', {session:false}), (req, res)=>{
  var id = req.params.id;
  async.waterfall([
    function(done){
      User.getUser({_id: id}, (err,user) => {
        if (!user) return res.json({success: false, msg:'User not exist !'});
        if (!authorization.authorUser(req.user,'update',user.role)) return res.json({success: false, msg: 'Unauthorized !'});
        done(err,user);
      })
    },
    function(user, done){
      let correctUser = {
          username : user.username,
          name : req.body.name || user.name,
          email : req.body.email || user.email,
          password : user.password,
          role : req.body.role || user.role
      }
      if (req.user.role != "Admin") correctUser.role = user.role;
      User.getUser({email: correctUser.email, username: {$nin: [user.username]}}, (err,docs)=>{
        if (docs) return res.json({success: false , msg: 'Exist email, try another one !'});
        done(err,correctUser);
      })
    },
    function(correctUser, done){
      auth.updatePermission(correctUser, (err,user) =>{
        done(err,user);
      })
    },
    function(user, done){
      User.correctUser({_id: id},user,(err)=>{
        if (err) return res.json({success: false, msg:'Failed to update this user !'});
        return res.json({success: true, msg:'User has been updated !'});
      })
    }
  ])
})

//Delete user by id
router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
  User.getUser({_id: req.params.id}, (err, user) => {
    if (err) return res.json({success: false, msg:'Invalid request !'});
    if (!user) return res.json({success: false, msg:'User not exist !'});
    if (!authorization.authorUser(req.user,'delete',user.role)) return res.json({success: false, msg: 'Unauthorized !'});
    User.deleteUser({_id: req.params.id}, (err) => {
      if (err) return res.json({success: false, msg:'Failed to delete user !'});
      return res.json({success: true, msg:'User has been removed !'});
    })
  })
});

module.exports = router;

//jkjkjjjj
