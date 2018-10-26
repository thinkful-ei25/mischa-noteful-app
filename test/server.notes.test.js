'use strict';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { app } = require('../server');
const {TEST_DATABASE_URL} = require('../config');
const expect = chai.expect;
const { notes } = require('../db/seed/data');
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
  
  describe('GET /  all notes', function() {
    let res;
    it('GET request "/" should return 10 notes with content, ids and titles', () => {
      return chai.request(app)
        .get('/api/notes')
        .then(function (_res) {
          res = _res;
          expect(res.body).to.have.lengthOf.at.least(1);
          expect(res).to.have.status(200);
          res.body.forEach((note) => expect(note).to.have.keys('content', 'createdAt', 'id','title','updatedAt', 'folderId'));
          return Note.countDocuments();
        })
        .then((count) => {
          expect(res.body).to.have.lengthOf(count);
        });
    });
    it('Should return queried notes and folders if query', () => {
      const searchTerm = 'Posuere';
      const re = new RegExp(searchTerm, 'i');
      // const query = {$or : [{title: re },{content: re}]};
      const dbPromise = Note.find({$or : [{title: re },{content: re}]}).sort({ updatedAt: 'desc' });
      const apiPromise = chai.request(app)
        .get(`/api/notes?searchTerm=${searchTerm}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          console.log('res.body result: ', res.body);
          console.log('data result: ', data);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.has.length(4);
          res.body.forEach((item, i) => {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt');
            expect(item.title).to.equal(data[i].title);
            expect(item.id).to.equal(data[i].id);
            expect(item.content).to.equal(data[i].content);
          });
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
          expect(res.body).to.have.keys('content', 'createdAt', 'id','title','updatedAt', 'folderId');
          return Note.findById(id);
        })
        .then((note) => {
          expect(note.id).to.equal(res.body.id);
          expect(note.title).to.equal(res.body.title);
          expect(note.content).to.equal(res.body.content);
          expect(note.folderId.toString()).to.equal(res.body.folderId);
        });
    });
    it('should return 400 with bad id',()=>{
      return chai.request(app)
        .get('/api/notes/123')
        .then((response) => expect(response).to.have.status(400));
    });
  });

  describe('POST create a new object', () => {
    const newNote = {
      title: '60 lessons from math class',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
      folderId: '111111111111111111111100'
    };
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
          console.log('update note: ', _res.body);
          expect(res.body).to.include.keys('content', 'createdAt', 'id','title','updatedAt', 'folderId');
          return Note.findById(res.body.id);
        })
        .then((note) => {
          expect(note.id).to.equal(res.body.id);
          expect(note.title).to.equal(res.body.title);
          expect(note.content).to.equal(res.body.content);
          expect(note.folderId.toString()).to.equal(res.body.folderId);
        });
    }); 
  });
  describe('PUT endpoint', () => {
    const newNote = {
      title: '60 lessons from math class',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
      folderId: '111111111111111111111100'
    };
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
          expect(res).to.have.status(202);
          return Note.findById(res.body.id);
        })
        .then((note) => {
          expect(note.id).to.equal(res.body.id);
          expect(note.title).to.equal(res.body.title);
          expect(note.content).to.equal(res.body.content);
          expect(note.folderId.toString()).to.equal(res.body.folderId);
        }); 
    });
    const updateNoteNoFolder = {
      title: '60 lessons from math class',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur'
    };
    it('should remove folderId if update does note contain one', () => {
      let res;
      return Note
        .findOne()
        .then((note) => {
          newNote.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .send(updateNoteNoFolder);
        })
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(202);
          expect(res.folderId).to.be.undefined;
          return Note.findById(res.body.id);
        })
        .then((note) => {
          expect(note.id).to.equal(res.body.id);
          expect(note.title).to.equal(res.body.title);
          expect(note.content).to.equal(res.body.content);
          expect(note.id.folderId).to.be.undefined;
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

