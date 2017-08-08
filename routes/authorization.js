module.exports.authorUser = function(user,action,appliedTo){
  for (let i in user.permission){
    if (user.permission[i].action == action && user.permission[i].appliedTo == appliedTo) return true;
  }
  return false;
}

module.exports.getAppliedToByAction = function(user,action){
  var arr_appliedTo = [];
  for (let i in user.permission){
    if (user.permission[i].action == action) arr_appliedTo.push(user.permission[i].appliedTo);
  }
  return arr_appliedTo;
}
