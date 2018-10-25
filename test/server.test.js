'use strict';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { app } = require('../server');
const {TEST_DATABASE_URL} = require('../config');
const expect = chai.expect;
const { notes } = require('../db/seed/notes');
const Note  = require('../models/note');
chai.use(chaiHttp);

describe('Reality Check', () => {

  it('true should be true', () => {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4', () => {
    expect(2 + 2).to.equal(4);
  });

});

describe('Environment', () => {

  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

});

describe('Basic Express setup', () => {

  describe('Express static', () => {

    it('GET request "/" should return the index page', () => {
      return chai.request(app)
        .get('/')
        .then(function (res) {
          expect(res).to.exist;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
        });
    });

  });

  describe('404 handler', () => {

    it('should respond with 404 when given a bad path', () => {
      return chai.request(app)
        .get('/bad/path')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });
});
function seedNotesData(){
  return Note.insertMany(notes);
}

function compareDBtoApi(note, res){
  for(let key in res.body) {
    if(key !== 'createdAt' && key !== 'updatedAt' ){
      expect(res.body[key]).to.equal(note[key]);
    }else{
      expect(res.body[key]).to.equal(note[key].toISOString());
    }
  }
}
function tearDownDb() {
  // console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}
describe('Notes API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedNotesData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return mongoose.connect(TEST_DATABASE_URL, {useNewUrlParser: true}).then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return seedNotesData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return mongoose.disconnect();
  });
  const apiRoute = '/api/notes';
  const noteKeys = ['content', 'createdAt', 'id','title','updatedAt'];
  describe('GET /  all notes', function() {
    let res;
    it('GET request "/" should return 10 notes with content, ids and titles', () => {
      return chai.request(app)
        .get('/api/notes')
        .then(function (_res) {
          res = _res;
          expect(res.body).to.have.lengthOf.at.least(1);
          expect(res).to.have.status(200);
          res.body.forEach((note) => expect(note).to.have.keys(noteKeys));
          return Note.countDocuments();
        })
        .then((count) => {
          expect(res.body).to.have.lengthOf(count);
        });
    });
  });

  describe('GET /:id note by id', () => {
    let res;
    let id = '000000000000000000000000';
    it('should return a single note, with all keys and a 200 status', function() {
      return chai.request(app)
        .get(`/api/notes/${id}`)
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys(noteKeys);
          return Note.findById(id);
        })
        .then((note) => {
          compareDBtoApi(note, res);
        });
    });
    // it('should return 404 with bad id',()=>{
    //   return chai.request(app)
    //     .get('/api/notes/123')
    //     .then((response) => expect(response).to.have.status(404));
    // });
  });
  const newNote = {
    title: '60 lessons from math class',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur'
  };
  describe('POST create a new object', () => {
    let res;
    it('should create a single note with all keys', function() {
      return chai.request(app)
        .post('/api/notes/')
        .send(newNote)
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          console.log(res.body);
          expect(res.body).to.include.keys(noteKeys);
          expect(res.body.id).to.not.be.null;
          for(let key in newNote){
            console.log(key);
            expect(res.body[key]).to.equal(newNote[key]);
          }
          return Note.findById(res.body.id);
        })
        .then((note) => {
          compareDBtoApi(note, res);        
        });
    }); 
  });
  describe('PUT endpoint', () => {
    it('should update fields sent over', () => {
      let res;
      return Note
        .findOne()
        .then((note) => {
          newNote.id = note.id;

          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .send(newNote);
        })
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(201);
          return Note.findById(res.body.id);
        })
        .then((updatedNote) => {
          compareDBtoApi(updatedNote, res.body);
        }); 
    });
  });
  describe('DELETE endpoint', () => {
    it('should delete a restaurant by id', () => {
      let note;

      return Note
        .findOne()
        .then((_note) => {
          note = _note;
          return chai.request(app)
            .delete(`/api/notes/${note.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          return Note.findById(note.id);
        }) 
        .then((_note) => {
          expect(_note).to.be.null;
        });
    });
  });
});

