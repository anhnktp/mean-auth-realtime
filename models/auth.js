const mongoose = require('mongoose');
const async = require('async');

const Auth_itemSchema = mongoose.Schema({
  id : Number,
  name : String,
  appliedTo : String
})

const Auth_assignSchema = mongoose.Schema({
  parent : Number,
  child : Number,
})

const Auth_item = mongoose.model('Auth_item', Auth_itemSchema,'Auth_item');
const Auth_assign = mongoose.model('Auth_assign', Auth_assignSchema,'Auth_assign');

module.exports.updatePermission = function(user,callback){
  async.waterfall([
    function(done){
      Auth_item.findOne({name: user.role},(err,item) => {
        done(err,item);
      })
    },
    function(item,done){
      Auth_assign.find({parent: item.id}, (err,docs) => {
        var arrFirstChild = [];
        for (let i in docs) arrFirstChild.push(docs[i].child);
        done(err,arrFirstChild);
      })
    },
    function(arrFirstChild,done){
      Auth_assign.find({parent: {$in: arrFirstChild}}, (err,docs) => {
        var arrSecondChild = [];
        for(let i in docs) arrSecondChild.push(docs[i].child);
        if (arrSecondChild.length == 0) done(err,{id: {$in: arrFirstChild}})
        else done(err,{id: {$in: arrSecondChild}});
      })
    },
    function(query,done){
      Auth_item.find(query, (err,docs) => {
        var arrPermission = [];
        for (let i in docs) arrPermission.push({action: docs[i].name, appliedTo: docs[i].appliedTo});
        var newUser = {
          name : user.name,
          username : user.username,
          email: user.email,
          password : user.password,
          role: user.role,
          permission: arrPermission
        }
        callback(err,newUser);
      })
    }
  ])
}
