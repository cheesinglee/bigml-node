var assert = require('assert'),
  bigml = require('../index');

describe('Manage local model objects', function () {
  var sourceId, source = new bigml.Source(), path = './data/movies.csv',
    datasetId, dataset = new bigml.Dataset(),
    modelId, model = new bigml.Model(), prediction = new bigml.Prediction(),
    modelResource, modelFinishedResource,
    localModel,
    inputData1 = {"gender": "Female", "genres": "Adventure$Action",
                  "timestamp": 993906291, "occupation": "K-12 student",
                  "zipcode": 59583, "rating": 3};

  before(function (done) {
    var itemsField = {
      'fields': {'000007': {
        'optype': 'items', 'item_analysis': {'separator': '$'}}}};
    source.create(path, undefined, function (error, data) {
      assert.equal(data.code, bigml.constants.HTTP_CREATED);
      sourceId = data.resource;
      source.get(sourceId, true, function (error, data) {
        source.update(sourceId, itemsField, function (error, data) {
          dataset.create(sourceId, undefined, function (error, data) {
            assert.equal(data.code, bigml.constants.HTTP_CREATED);
            datasetId = data.resource;
            model.create(datasetId, {'objective_field': '000002'},
              function (error, data) {
              assert.equal(data.code, bigml.constants.HTTP_CREATED);
              modelId = data.resource;
              modelResource = data;
              model.get(modelResource, true, 'only_model=true', function (error, data) {
                modelFinishedResource = data;
                prediction = prediction.create(modelId, inputData1, function (error, data) {
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  describe('LocalModel(modelId)', function () {
    it('should create a localModel from a model Id', function (done) {
      localModel = new bigml.LocalModel(modelId);
      if (localModel.ready) {
        assert.ok(true);
        done();
      } else {
        localModel.on('ready', function () {assert.ok(true);
          done();
          });
      }
    });
  });
  describe('#predict(inputData, callback)', function () {
    it('should predict asynchronously from input data', function (done) {
      localModel.predict(inputData1, function (error, data) {
        assert.equal(data.prediction, prediction['object']['output']);
        assert.equal(data.confidence, prediction['object']['confidence']);
        done();
      });
    });
  });
  after(function (done) {
    source.delete(sourceId, function (error, data) {
      assert.equal(error, null);
      done();
    });
  });
  after(function (done) {
    dataset.delete(datasetId, function (error, data) {
      assert.equal(error, null);
      done();
    });
  });
  after(function (done) {
    model.delete(modelId, function (error, data) {
      assert.equal(error, null);
      done();
    });
  });
});
