const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');




mongoose.connect(MONGODB_URI, { useNewUrlParser:true })

// ---Find by id--------------------------------------------------
  .then(() => {
    const id = '000000000000000000000004';
    return Note.findById(id);
  })
  .then(results => {
    console.log('FIND BY ID: \n',results);
  })

// ---Find all----------------------------------------------------
  .then(() => {
    const searchTerm = 'small';
    // const searchTerm = null;
    let filter = {};
    const re = new RegExp(searchTerm, 'i');
    if (searchTerm) {
      filter.title = re,
      filter.content = re;
    }

    return Note
      .find({$or : [{title: filter.title}, {content: filter.content}]
 
      })
      .sort({ updatedAt: 'desc' });
  })
  .then(results => {
    console.log('FIND ALL: \n', results);
  })


  

// ---Create note--------------------------------------------------
  .then(() => {
    const newNote = {
      title: 'The least interesting thing about rodents from the north',
      content: 'they\'r quite small'  
    };
    return Note.create(newNote);
  })
  .then(result => {
    console.log('NEW NOTE: \n', result);
  })

/*---Update by id------------------------------------------------ */ 
  .then(() => {
    const id = '5bcf70e71865e25eb959aebd';
    const updateNote = {
      title: 'The smallest thing about big cats',
      content: 'their little cheecks'
    };
    return Note.findByIdAndUpdate(id,updateNote);
  })
  .then(result => {
    console.log('UPDATED NOTE: \n', result);
  })

// ---Delete by id-------------------------------------------------
  .then(() => {
    const id = '5bcf71a00ff29c5f321b07e2';
    return Note.findByIdAndRemove(id);
  })
  .then(result => {
    console.log('DELETED NOTE:\n', result);
  })

// ---End mongoose and log errors----------------------------------
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

