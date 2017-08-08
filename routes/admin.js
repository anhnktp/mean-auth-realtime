const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const auth = require('../models/auth');

const smtpTransport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'anhnktp@gmail.com',
    pass: 'dieulinh'
  }
});

//update permissions
router.get('/updatepermission', passport.authenticate('jwt', {session:false}), (req, res, next) => {
  if (req.user.role != 'Admin') return res.json({success: false , msg: 'Unauthorized'});
  User.getAllUser({},(err,docs) => {
    if (err) next(err);
    for(let i in docs){
      auth.updatePermission(docs[i],(err,user) => {
        User.correctUser({username: user.username}, user, (err) => {
          if (err) next(err);
        });
      })
    }
    return res.json({success: true , msg: 'Update permissions of all users successfully !'});
  })
})

//reset password by admin
router.get('/reset/:id', (req, res, next) => {
  User.getUser({_id: req.params.id}, (err, user) => {
    if (err) next(err);
    if (!user) return res.json({success: false, msg: "User not found !"});
    user.password = '123456';
    User.createUser(user,(err)=>{
      if (err) return res.json({success: false, msg: "Reset password failed !"});
      var mailOptions = {
        to: user.email,
        from: 'anhnktp@gmail.com',
        subject: 'Node.js Password Reset By Admin',
        text: 'You are receiving this because Admin reset your password to:   123456\n\n' +
          'Let go to profile and re-change new password !.\n'
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        if (err) return res.json({success: false, msg: "Server send email failed !"});
        return res.json({success: true, msg: "Server send email successfully !"});
      });
    })
  })
})

module.exports = router;
