var request = require('request');
var jsonfile = require('jsonfile');
var fs = require('fs');
var async = require('async')

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


  /**
 * Get the Watson Discovery Environment needed to process documents.
 * @return {Promise} - promise that returns an environmentID
 * object resolved:
 * envID = {
 * a1cdff92-0a77-4855-802c-adb8d1794bc6
 * }
 */
  getDiscoveryEnvironments() {
    return new Promise((resolve, reject) => {
      discovery.getEnvironments({}, function(error, data) {
        if(error) {
          reject(error);
        } else {
          // console.log(JSON.stringify(data, null, 2));
          if (data.environments.length === 1) {
            discovery.createEnvironment({
              name: 'reviews_environment',
              description: 'My environment'
            }, function (err, response) {
              if (err)
                reject('error:', err);
              else {
                resolve(response.environment_id);
              }
            });
          } else {
            envID = data.environments[1].environment_id;
            resolve(envID);
          }
        }
      });
    });
  }

  /**
 * Get the Watson Discovery Configuration needed to process documents.
 * @param {String} envID - environmentID of our Watson Discovery instance
 * @return {Promise} - promise that returns a configuration ID
 * object resolved:
 * configID = {
 * 70e57cdf-40e5-4bdb-ad5e-ba36075e9720
 * }
 */
  getDiscoveryConfigurations(envID) {
    return new Promise((resolve, reject) => {
      discovery.getConfigurations({
        environment_id: envID
      }, function(error, data) {
        if (error) {
          reject(error);
        } else {
          configID = data.configurations[0].configuration_id;
          resolve(configID);
        }
      });      
    });
  }

  /**
 * Get the Watson Discovery Collection needed to upload documents. First,
 * we check to see if there are any active collections. If there is a 
 * collection with the documents of the product that the user enters, and 
 * it contains the same amount of documents that listed in Cloudant for 
 * that particular product, then we use the current collection. Else, we 
 * create a new collection named after the reviewID of the product the 
 * user enters, so that we store all reviews for this product in this 
 * collection. 
 * @param {String} envID - environmentID of our Watson Discovery instance
 * @param {String} configID - configurationID of our Watson Discovery instance
 * @param {String} reviewID - product ID of Amazon Product found in URL
 * @return {Promise} - an array of collections, and other useful info
 * such as the date and time created
 * object resolved:
 * obj = {
 * collectionID: '0b5bd6d1-9faa-455e-bb07-2fe0aa66740b',
 * configID: '70e57cdf-40e5-4bdb-ad5e-ba36075e9720',
 * envID: 'a1cdff92-0a77-4855-802c-adb8d1794bc6',
 * data: { collections: [ [Object] ] }
 * }
 */
  getDiscoveryCollections(envID, configID, reviewId) {
    return new Promise((resolve, reject) => {
      discovery.getCollections({ 
        environment_id: envID 
      }, function(error, data) {
        if (error) {
          reject(error);
        } else {
          // console.log(JSON.stringify(data, null, 2));
          if (data.collections.length > 0) {
              var obj = {};
              obj.collectionID = data.collections[0].collection_id;
              obj.configID = configID;
              obj.envID = envID;
              obj.data = data;
              resolve(obj);
          } else {
            discovery.createCollection({
              environment_id: envID,
              name: reviewId,
              description: 'reviews for the Amazon productId',
              configuration_id: configID,
              language: 'en' 
            }, function(error, data) {
              if (error) {
                reject(error);
              } else {
                collectionID = data.collection_id;
                var obj = {};
                obj.data = data;
                obj.collectionID = collectionID;
                obj.configID = configID;
                obj.envID = envID;
                resolve(obj);
              }
            });
          }
        }
      });
    });
  }

  /**
 * See detailed info about our collection. This is 
 * need to check if we can use the current collection 
 * to analyze the product, or if we have to create a new 
 * one to store the reviews for a different product
 * @param {String} credentials - this object contains
 * the environmentID, the configurationID, and 
 * the collectionID.
 * @return {Promise} - promise that contains useful
 * info such as how many docs are processing, how many failed, 
 * what time was collection created, etc.
 * object resolved:
 * data = {
 * collection_id: '0b5bd6d1-9faa-455e-bb07-2fe0aa66740b',
  name: 'B0006SH4GE',
  configuration_id: '70e57cdf-40e5-4bdb-ad5e-ba36075e9720',
  language: 'en',
  status: 'active',
  description: 'reviews for the Amazon productId',
  document_counts: { available: 329, processing: 0, failed: 0 },
  disk_usage: { used_bytes: 1167969 },
  training_status:
   { data_updated: '',
     minimum_queries_added: false }
 * }
 */
  getCollectionInfo(credentials) {
    return new Promise(function (resolve,reject) {
      discovery.getCollection({
        environment_id: credentials.envID,
        collection_id: credentials.collectionID
      }, function(error, data) {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      }); 
    });
  }

  /**
 * Add documents to our collection
 * @param {String} reviews - an array of reviews
 * @param {String} credentials - this object contains
 * the environmentID, the configurationID, and 
 * the collectionID.
 * @return {Promise} - returns on object that 
 * contains info on the processing of our document. 
 * object resolved:
 * obj = {
 * document_id: '0ed09e22-eec3-4261-b314-e20aa656fb6f',
 * status: 'processing' 
 * }
 */
watsonAddDocument(reviews, credentials) {
  var promise = new Promise(function (resolve,reject) {
    var length = reviews.reviews.length
    var chunk = 10;
    var arrayOfReviews = reviews.reviews;
    var temporaryArray;
    var i = 0;
    console.log('reviews len: ');
    console.log(length);

    async.whilst(function () {
      return i <= length;
    },
    function (next) {
        var end = i+chunk-1;
        console.log('uploading review ' + i + ' to ' + end);
        temporaryArray = arrayOfReviews.slice(i,i+chunk);
        console.log('MY TEMPORARY ARRAY LENGTH IS ' + temporaryArray.length)
        var index = 0;
        var uploadedReviews = 0;
        while(index<temporaryArray.length) {
          discovery.addJsonDocument({
            environment_id: credentials.envID,
            collection_id: credentials.collectionID,
            file: temporaryArray[index]
          }, function(error, data) {
              if (error) {
                console.log(error);
              }
              uploadedReviews++;
              if (uploadedReviews == temporaryArray.length) {
                i += chunk;
                uploadedReviews = 0;
                setTimeout(next, 500)
              }
          });
          index++;
      }
    },
    function (err) {
      // All things are done!
      console.log('done uploading')
      resolve(true);
    });
  });
  return promise;
}


 /**
 * Query and analyze unstructured data in our collection of documents
 * @param {String} credentials - this object contains
 * the environmentID, the configurationID, and 
 * the collectionID.
 * @return {Promise} - the analysis of our collection. The top keywords,
 * percentage of negative/positive sentiment, and other data. 
 * discovery.query function
 * object resolved:
 * obj = {
 * "matching_results":109,"results":[{"id":"0d20f9ab-901f-4250-adae-03bd44d05002",
 * "result_metadata":{"score":1},"text":"Cuts right through grease.
 *  Strong product and its concentrated so dilute 4:1",
 * "authorLink":"/gp/profile/amzn1.account.AFOFAP5OFUCTRYGGRQEOSYLXUEFQ/ref=cm_cr_arp_d_pdp?ie=UTF8",
 * "rating":5,"enriched_text":{"sentiment":{"document":{"score":-0.39447,"label":"negative"}}
 * }
 */
  discoveryQuery(credentials) {
    var promise = new Promise(function (resolve,reject) {

      var discoveryUrl = 'https://gateway.watsonplatform.net/discovery/api/v1/' +
      'environments/' + credentials.envID + '/' + 
      'collections/' + credentials.collectionID + '/' + 
      'query?count=1000&version=2017-11-07';
  
      console.log('about to query')

      request.get({
        url: discoveryUrl,
        version_date: '2017-11-07',
        auth: {
            user: config.discoveryUsername,
            pass: config.discoveryPassword
        }
      }, function(err, response, body) {
        if (err) {
          reject('there is an error in the query');
        }
        // console.log('body: ');
        // console.log(body)
        resolve(body);
      });
    });
    return promise;
  }

  /**
 * Delete our collection
 * @param {String} credentials - this object contains
 * the environmentID, the configurationID, and 
 * the collectionID.
 * @return {Promise} - returns a promise which holds info such as 
 * if our collection was successfully deleted
 * object resolved:
 * obj = {
 * collection_id: '50850037-7715-42cd-a898-5cd5966684c5',
 * status: 'deleted' 
 */
  deleteCollection(credentials) {
    return new Promise(function (resolve,reject) {
      discovery.deleteCollection({
        environment_id: credentials.envID,
        collection_id: credentials.collectionID 
      }, function(error, data) {
        if (error){
          reject(error);
        } else {
          console.log('successfully deleted collection')
          resolve(data);
        }
      });
    });
  }
}

module.exports = Watson;

var watson = new Watson;

