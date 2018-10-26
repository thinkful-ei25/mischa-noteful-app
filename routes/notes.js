'use strict';

const express = require('express');

const router = express.Router();

const Note = require('../models/note');

const mongoose = require('mongoose');



/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  // console.log("proccess env var: ", process.env);
  const searchTerm = req.query.searchTerm;
  const folderId = req.query.folderId;
  // console.log('folderId is', folderId);
  // console.log(searchTerm);
  let filter = {};
  let query = {};
  const re = new RegExp(searchTerm, 'i');
  if (searchTerm) {
    filter.title = re,
    filter.content = re;
    query = {$or : [{title: filter.title},{content: filter.content}]};
  }
  if (folderId){

    filter.folderId = folderId;
    Object.keys(query).length === 0 ? query = {folderId: filter.folderId} : query.$or.push({folderId: filter.folderId});
  }
  
  Note
    .find(query)
    .sort({ updatedAt: 'desc' })  
    .then((results) => {
      res.json(results);
      console.log('folder is: ',results[0].folderId);
    })
    .catch(err => {
      next(err);
    });
  

});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('please enter valid id!');
    err.status = 400;
    return next(err);
  }

  Note.findById(id)
    .then((result) => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});
// function validateFolder(id){
//   if (!mongoose.Types.ObjectId.isValid(folderId)){
//     const err = new Error ('Please input valid folder id');
//     err.status = (400);
//     return err;
//   }else return true;
// }

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const {title, content, folderId} = req.body;
  //validate user input
  if(!title){
    const err = new Error('title is required!');
    err.status = (400);
    next(err);
  }
  if(folderId){
    if (!mongoose.Types.ObjectId.isValid(folderId)){
      const err = new Error ('Please input valid folder id');
      err.status = (400);
      return next(err);
    }
  }
  const newNote = {title, content, folderId};

  Note
    .create(newNote)
    .then((result) => {
      res.location(`api/notes/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const {title, content, folderId} = req.body;
  const updateNote = {title, content, folderId};
  
  if(folderId){
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      const err = new Error('please enter valid id!');
      err.status = 400;
      return next(err);
    }
  }
  if(!updateNote.folderId){
    delete updateNote.folderId;
    updateNote.$unset = {folderId : 1};
  }
  Note
    .findByIdAndUpdate(id, updateNote, {new: true})  
    .then((result) =>  {
      res.location(`api/notes/${result.id}`).status(202).json(result);
    })
    .catch(err => next(err));
  

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('please enter valid id!');
    err.status = 400;
    return next(err);
  }
  const id = req.params.id;
  Note.findByIdAndRemove(id)
    .then(() => res.status(204).end())
    .catch(err => next(err));
  
});

module.exports = router;