const express = require('express');

const router = express.Router();

const Tag = require('../models/tag');

const Note = require('../models/note')

const mongoose = require('mongoose');

router.get('/', (req, res, next) => {
  Tag
    .find()
    .sort({name: 'desc'})
    .then((results) => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  //validate id
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('please enter valid id!');
    err.status = 400;
    return next(err);
  }

  Tag
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
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {

  const {name} = req.body;
  if(!name){
    const err = new Error('you forgot the name :-O');
    err.status = 400;
    return next(err);
  }
  const newTag = { name };
  Tag
    .create(newTag)
    .then((result) => {
      res.location(`api/folder/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The tag name already exists');
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
  const updateTag = {name};

  Tag
    .findByIdAndUpdate(req.params.id, updateTag, {new :true})
    .then((result) => {
      res.status(202).json(result);
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The tag name already exists');
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
  
  const tagRemovePromise = Tag.findByIdAndRemove(id);
  const noteRemovePromise = Note.updateMany(
    {tags: id}, {$pull: {tags: id}}
  );
  Promise.all([tagRemovePromise, noteRemovePromise])

    .then(() => {
      res.status(204).end();
    })
    .catch(err => next(err));
  
});

module.exports = router;