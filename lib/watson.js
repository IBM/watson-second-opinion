var request = require('request');
var jsonfile = require('jsonfile');
var fs = require('fs');

var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
config = jsonfile.readFileSync(__dirname + '/../config.json' );

var discovery = new DiscoveryV1({
  username: config.discoveryUsername,
  password: config.discoveryPassword,
  version_date: '2017-11-07'
});

var envID = '';
var configID = '';
var collectionID = '';

class Watson {

  getDiscoveryEnvironments() {
    return new Promise((resolve, reject) => {
      discovery.getEnvironments({}, function(error, data) {
        if(error) {
          reject(error)
        } else {
          console.log(JSON.stringify(data, null, 2));
          if (data.environments.length === 1) {
            discovery.createEnvironment({
              name: 'reviews_environment',
              description: 'My environment'
            }, function (err, response) {
              if (err)
                reject('error:', err);
              else {
                resolve(response.environment_id)
              }
            });
          } else {
            envID = data.environments[1].environment_id
            resolve(envID)
          }
        }
      });
    });
  }

  getDiscoveryConfigurations(envID) {
    return new Promise((resolve, reject) => {
      discovery.getConfigurations({
        environment_id: envID
      }, function(error, data) {
        if (error) {
          reject(error)
        } else {
          configID = data.configurations[0].configuration_id;
          resolve(configID)
        }
      });      
    });
  }

  getDiscoveryCollections(envID, configID, reviewId) {
    return new Promise((resolve, reject) => {
      // console.log('inside disc collections: ')
      discovery.getCollections({ 
        environment_id: envID 
      }, function(error, data) {
        if (error) {
          reject(error)
        } else {
          console.log(JSON.stringify(data, null, 2));
          if (data.collections.length > 0) {
              var obj = {};
              obj.collectionID = data.collections[0].collection_id;
              obj.configID = configID;
              obj.envID = envID;
              obj.data = data;
              resolve(obj)
          } else {
            discovery.createCollection({
              environment_id: envID,
              name: reviewId,
              description: 'reviews for the Amazon productId',
              configuration_id: configID,
              language: 'en' 
            }, function(error, data) {
              if (error) {
                reject(error)
              } else {
                collectionID = data.collection_id
                var obj = {};
                obj.data = data;
                obj.collectionID = collectionID;
                obj.configID = configID;
                obj.envID = envID;
                resolve(obj)
              }
            });
          }
        }
      });
    });
  }

  getCollectionInfo(credentials) {
    return new Promise(function (resolve,reject) {
      discovery.getCollection({
        environment_id: credentials.envID,
        collection_id: credentials.collectionID
      }, function(error, data) {
        if (error) {
          reject(error)
        } else {
          // console.log('resolving collection info: ')
          resolve(data)
        }
      }); 
    });
  }

  watsonAddDocument(reviews, credentials) {
    var promise = new Promise(function (resolve,reject) {
      var docs = 0;
      var errFlag = false;
      // console.log('reviews len: ')
      // console.log(reviews.reviews.length)
      var length = reviews.reviews.length;
      for (var i = 0; i < length; i++) {
        discovery.addJsonDocument({
          environment_id: credentials.envID,
          collection_id: credentials.collectionID,
          file: reviews.reviews[i]
        }, function(error, data) {
            docs++;
            if(docs === length) {
              console.log('uploaded all of the docs. waiting for Watson Discovery to process documents...')
              setTimeout(function(){ resolve(data)}, 8000);            
            }
        });
      }
    });
    return promise;
  }

  discoveryQuery(credentials) {
    var promise = new Promise(function (resolve,reject) {
      var query = '';

      var queryUrl = 'https://gateway.watsonplatform.net/discovery/api/v1/'
      + 'environments/' + credentials.envID + '/'
      + 'collections/' + credentials.collectionID + '/'
      + 'query?query=' + query + '&count=10&version=2017-11-07'
  
      request.get({
        url: queryUrl,
        version_date: '2017-11-07',
        auth: {
            user: config.discoveryUsername,
            pass: config.discoveryPassword
        }
      }, function(err, response, body) {
        if (err) {
          reject('there is an error in the query')
        } else {
          resolve('query worked')
        }
        console.log('Query Results: \n' + body);
      });
    });
    return promise;
  }

  deleteCollection(credentials) {
    return new Promise(function (resolve,reject) {
      discovery.deleteCollection({
        environment_id: credentials.envID,
        collection_id: credentials.collectionID 
      }, function(error, data) {
        if (error){
          console.log('err')
          reject(error)
        } else {
          resolve(data)
        }
      });
    });
  }
    
}

module.exports = Watson;
