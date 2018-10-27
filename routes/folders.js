const express = require('express');

const router = express.Router();

const Folder = require('../models/folder');

const mongoose = require('mongoose');

// const validateId = require('../utils/validate-mongoose-id');

router.get('/', (req,res,next) => {
  Folder
    .find()
    .sort({ name: 'desc' })  
    .then((results) => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

router.get('/:id', (req, res, next) => {
  //validation

  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('please enter valid id!');
    err.status = 400;
    return next(err);
  }

  Folder
    .findById(req.params.id)
    .then((result) => {
      if(!result){
        const err = new Error('id not found');
        err.status = 404;
        next(err);
      }else{
        res.json(result);
      }
    })
    .catch(err => {
      next(err);
    });
});
router.post('/', (req, res, next) => {

  const {name} = req.body;
  if(!name){
    const err = new Error('you forgot the name :-O');
    err.status = 400;
    return next(err);
  }
  const newFolder = {name};
  Folder
    .create(newFolder)
    .then((result) => {
      res.location(`api/folder/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.put('/:id', (req, res, next) => {
  const {name} = req.body;
  if(!name){
    const err = new Error('you forgot the name :-O');
    err.status = 400;
    return next(err);
  }else if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('please enter valid id!');
    err.status = 400;
    return next(err);
  }
  const updateObj = {name};

  Folder
    .findByIdAndUpdate(req.params.id, updateObj, {new :true})
    .then((result) => {
      res.status(201).json(result);
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('please enter valid id!');
    err.status = 400;
    return next(err);
  }
  
  Folder.findByIdAndRemove(id)

    .then(() => {
      res.status(204).end();
    })
    .catch(err => next(err));
  
});

module.exports = router;