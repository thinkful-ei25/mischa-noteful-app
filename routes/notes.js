'use strict';

const express = require('express');

const router = express.Router();

const Note = require('../models/note');

const Folder = require('../models/folder');
console.log('Folder is:' + Folder);
const Tag = require('../models/tag');
console.log('Tag is:' + Tag);
const mongoose = require('mongoose');

function checkIfDocumentInCollection(Collection, documents, nameOfDocument){
  return Collection.find({ _id: { $in: documents } })
    .then((result) => {
      if(result.length !== documents.length){
        const err = new Error (`${nameOfDocument} doesn't exist`);
        err.status = 404;
        return err;
      }
    });
}

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  // console.log("proccess env var: ", process.env);
  // const searchTerm = req.query.searchTerm;
  // const folderId = req.query.folderId;
  const {searchTerm, folderId, tagId } = req.query;
  // console.log('folderId is', folderId);
  // console.log(searchTerm);
  let filter = {};
  // let query = {};
  const re = new RegExp(searchTerm, 'i');
  if (searchTerm) {
    const title = re;
    const content = re;
    filter.$or = [{title: title},{content: content}];
  }
  
  if (folderId){
    filter.folderId = folderId;
  }
    
  if(tagId){
    filter.tags = tagId;
  }
  console.log(filter);
  Note
    .find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })  
    .then((results) => {
      res.json(results);
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
    .populate('tags')
    .then((result) => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  let {title, content, folderId, tags} = req.body;
  if(!tags){
    tags = [];
  }
  //validate user input
  if(!title){
    const err = new Error('title is required!');
    err.status = (400);
    next(err);
  }
  console.log('folderid is: ', folderId);
  if(folderId){
    if (!mongoose.Types.ObjectId.isValid(folderId)){
      const err = new Error ('Please input valid folder id');
      err.status = (400);
      return next(err);
    }
    // console.log('folder check: ', checkIfDocumentInCollection(Folder, folderId));
  }
  if(tags){ 
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)){
        const err = new Error ('Please input valid tag id');
        err.status = (400);
        return next(err);
      }
    });
  }
  // const newNote = {title, content, folderId, tags};
  // Note
  //   .create(newNote)
  //   .then((result) => {
  //     res.location(`api/notes/${result.id}`).status(201).json(result);
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
  checkIfDocumentInCollection(Tag, tags, 'tag')
    .then((err) => {
      if(err){
        return next(err);
      }
      checkIfDocumentInCollection(Folder, folderId, 'folder')
        .then((err) => {
          if(err){
            return next(err);
          }
          const newNote = {title, content, folderId, tags};
          Note
            .create(newNote)
            .then((result) => {
              res.location(`api/notes/${result.id}`).status(201).json(result);
            })
            .catch(err => {
              next(err);
            });
        });
      
    }); 
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const {title, content, folderId, tags} = req.body;
  const updateNote = {title, content, tags};
  
  if(folderId){
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      const err = new Error('please enter valid id!');
      err.status = 400;
      return next(err);
    }
    updateNote.folderId = folderId;
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