'use strict';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { app } = require('../server');
const {TEST_DATABASE_URL} = require('../config');
const expect = chai.expect;
const { folders } = require('../db/seed/data');
const Folder  = require('../models/folder');
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
function seedFoldersData(){
  return Folder.insertMany(folders);
}

function tearDownDb() {
  // console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}
describe('Folders API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedFoldersData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return mongoose.connect(TEST_DATABASE_URL, {useNewUrlParser: true}).then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return seedFoldersData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return mongoose.disconnect();
  });
  
  describe('GET /  all folders', function() {
    let res;
    it('GET request "/" should return 10 folders with content, ids and titles', () => {
      return chai.request(app)
        .get('/api/folders')
        .then(function (_res) {
          res = _res;
          expect(res.body).to.have.lengthOf.at.least(1);
          expect(res).to.have.status(200);
          res.body.forEach((folder) => expect(folder).to.have.keys('createdAt', 'id','name', 'updatedAt'));
          return Folder.countDocuments();
        })
        .then((count) => {
          expect(res.body).to.have.lengthOf(count);
        });
    });
  });


  describe('GET /:id folder by id', () => {
    let res;
    let id = '111111111111111111111101';
    it('should return a single folder, with all keys and a 200 status', function() {
      return chai.request(app)
        .get(`/api/folders/${id}`)
        .then((_res) => {
          res = _res;
          console.log(res.body);
          expect(res).to.have.status(200);
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('createdAt', 'id','name', 'updatedAt');
          return Folder.findById(id);
        })
        .then((folder) => {
          expect(folder.name).to.equal(res.body.name);
          expect(folder.id).to.equal(res.body.id);
        });
    });
    it('should return 400 with bad id',()=>{
      return chai.request(app)
        .get('/api/folders/123')
        .then((response) => expect(response).to.have.status(400));
    });
  });

  describe('POST create a new object', () => {
    const newFolder = {
      name: 'Cat Lessons'
    };
    let res;
    it('should create a single folder with all keys', function() {
      return chai.request(app)
        .post('/api/folders/')
        .send(newFolder)
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys( 'createdAt', 'id','name','updatedAt');
          return Folder.findById(res.body.id);
        })
        .then((folder) => {
          expect(folder.id).to.equal(res.body.id);
          expect(folder.name).to.equal(res.body.name);
        });
    }); 
  });
  describe('PUT endpoint', () => {
    const newFolder = {
      name: 'Cat Lessons'
    };
    it('should update fields sent over', () => {
      let res;
      return Folder
        .findOne()
        .then((folder) => {
          newFolder.id = folder.id;
          return chai.request(app)
            .put(`/api/folders/${folder.id}`)
            .send(newFolder);
        })
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(201);
          return Folder.findById(res.body.id);
        })
        .then((folder) => {
          expect(folder.id).to.equal(res.body.id);
          expect(folder.name).to.equal(res.body.name);
        }); 
    });
  });
  describe('DELETE endpoint', () => {
    it('should delete a restaurant by id', () => {
      let folder;

      return Folder
        .findOne()
        .then((_folder) => {
          folder = _folder;
          return chai.request(app)
            .delete(`/api/folders/${folder.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          return Folder.findById(folder.id);
        }) 
        .then((_folder) => {
          expect(_folder).to.be.null;
        });
    });
  });
});
