'use strict';

const express = require('express');

const router = express.Router();

const Note = require('../models/note');




/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  // console.log("proccess env var: ", process.env);
  const searchTerm = req.query.searchTerm;
  // console.log(searchTerm);
  let filter = {};
  let query = {};
  const re = new RegExp(searchTerm, 'i');
  if (searchTerm) {
    filter.title = re,
    filter.content = re;
    query = {$or : [{title: filter.title}, {content: filter.content}]};
  }
  Note
    .find(query)
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

  Note.findById(id)
    .then((result) => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const {title, content} = req.body;
  //validate user input
  if(!title){
    const err = new Error('title is required!');
    err.status = (400);
    next(err);
  }
  const newNote = {title, content};

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
  const {title, content} = req.body;
  const updateNote = {title, content};

  Note
    .findByIdAndUpdate(id, updateNote, {new: true})
    .then((result) =>  {
      res.location(`api/notes/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  Note.findByIdAndRemove(id)
    .then(() => res.status(204).end())
    .catch(err => next(err));
  
});

module.exports = router;