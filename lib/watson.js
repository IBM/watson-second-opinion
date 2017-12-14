var request = require('request');
var jsonfile = require('jsonfile');

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
                // console.log('about to resolve envID: ')
                // console.log(response.environment_id)
                resolve(response.environment_id)
              }
            });
          } else {
            envID = data.environments[1].environment_id
            // console.log(envID)
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
          // console.log('configID: ')
          // console.log(configID)
          resolve(configID)
        }
      });      
    });
  }

  getDiscoveryCollections(envID, configID) {
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
            if (config.envID === undefined) {
              // console.log('collectionID: ')
              // console.log(data.collections[0].collection_id)
              var obj = {};
              obj.collectionID = data.collections[0].collection_id;
              obj.configID = configID;
              obj.envID = envID;
              // console.log('obj')
              // console.log(obj)
              resolve(obj)
            } else {
              resolve();
            }
          } else {
            discovery.createCollection({
              environment_id: envID,
              name: 'reviews',
              description: 'buncha reviews',
              configuration_id: configID,
              language: 'en' 
            }, function(error, data) {
              if (error) {
                reject(error)
              } else {
                collectionID = data.collection_id
                var obj = {};
                obj.collectionID = collectionID;
                obj.configID = configID;
                obj.envID = envID;
                // console.log('obj')
                // console.log(obj)
                resolve(obj)
              }
            });
  
          }
        }
        
      });
    });
  }

  watsonAddDocument(reviews, credentials) {
    var promise = new Promise(function (resolve,reject) {
      var docs = 0;
      var errorFlag = false;
      var length = 0;
      if (reviews.length > 19) {
        length = 19;
      } else {
        length = reviews.length
      }
      for (var i = 0; i < length; i++) {
  
        discovery.addJsonDocument({
          environment_id: credentials.envID,
          collection_id: credentials.collectionID,
          file: reviews[i]
        }, function(error, data) {
          if(error) {
              errorFlag = true;
              console.log('addDocErr: ')
              console.log(error)
          } else {
            docs++;
            // console.log('document status: ')
            // console.log(data)
            if (docs === length) {
              // console.log('about to get to the timeout, and return from AddDoc')
              setTimeout(function(){ resolve(data)}, 10000);            
            }
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
    
}

module.exports = Watson;
