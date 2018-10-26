
const mongoose = require('mongoose');

function validateId(id){
  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('please enter valid id!');
    err.status = 400;
    return err;
  }else{
    return true;
  }
}

module.export = validateId;