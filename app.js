var request = require('request');
var cheerio = require('cheerio');
var cloudscraper = require('cloudscraper');
var express = require('express');
var Promise = require('promise');
var Cloudant = require('cloudant');
var app = express();
var review_url = "https://www.amazon.com/product-reviews/";
var review_page = "/ref=cm_cr_arp_d_paging_btm_2?pageNumber=";
var envID = '';
var configID = '';
var mydb;

var cloudantURL = process.env.CLOUDANT_URL;
var cloudant = Cloudant(cloudantURL, function(er, cloudant, reply) {
  if (er) {
    throw er;
  }
  console.log('Connected with username: %s', reply.userCtx.name);
});

// Create a database 'products' if it doesn't exist
cloudant.db.list(function(err,dbs) {
  if (!dbs.includes('products')) {
    console.log('Creating products database');

    cloudant.db.create('products', function() {
      mydb = cloudant.db.use("products");
    });
  }
  else {
    mydb = cloudant.db.use("products");
  }
});

// Watson config
var Watson = require('./lib/watson.js');
var watson = new Watson();

//get Environment & configiguration ready for Watson Discovery calls
watson.getDiscoveryEnvironments()
  .then(function(eID) {
    envID = eID;
    watson.getDiscoveryConfigurations(envID)
      .then(function(conf) {
        configID = conf;
      });
  });

app.use(require('body-parser').json());

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/public'));

app.get('/reviews/:reviewId', function(req, res) {
  var reviewId = req.params.reviewId;

  existingCloudantDoc(reviewId).then(function (result) {
    if (result) {
      console.log(reviewId + " document exists");
      scrapeNumberOfReviews(reviewId)
        .then(isNumberOfReviewsEqual)
        .then(function (options) {
          if (options.isEqualToScrape) {

            // if number of reviews in cloudant is equal to discovery results in cloudant
            // this could be "not equal" if the app fails to upload some of the reviews
            if (options.isReviewsEqualToDiscoveryDocuments) {
              console.log("Cloudant Document already has the watson Discovery Results");

              // get cloudant document then send the watson discovery result
              getCloudantReviews(reviewId)
                .then(function(reviews) {
                  res.send(reviews.watsonDiscovery);
                });
            }
            else {
              // if number of reviews from scrape and cloudant are equal
              // would mean reviews are synced
              // but discovery results in cloudant isn't equal to its number of reviews

              // get watson discovery collections
              watson.getDiscoveryCollections(envID, configID, reviewId)
              .then(function(currentDiscoveryInfo) {

                // get collection info 
                watson.getCollectionInfo(currentDiscoveryInfo)
                  .then(function(result) {

                    // check if the collection name is the same as the product name
                    console.log('doc count: ' + result.document_counts.available);
                    var collectionProduct = result.name;
                    if (reviewId === collectionProduct) {

                      // if it is
                      // check if number of reviews from cloudant is equal to watson reviews
                      console.log('collectionID === reviewID');
                      var collectionDocCount = result.document_counts.available + result.document_counts.processing;
                      var cloudCount = options.CloudReviewsLen;
                      if (collectionDocCount !== cloudCount) {

                        // if it is not
                        // delete the collections
                        watson.deleteCollection(currentDiscoveryInfo)
                          .then(function(result){

                            // get collection info
                            watson.getDiscoveryCollections(envID, configID, reviewId)
                              .then(function(currentDiscoveryInfo){

                                // get the reviews in cloudant
                                getCloudantReviews(reviewId)
                                  .then(function(reviews) {

                                    // start adding the reviews in cloudant to
                                    // the clean watson discovery collection
                                    console.log('number of reviews from cloudant ' +  reviews.reviews.length);
                                    watson.watsonAddDocument(reviews, currentDiscoveryInfo, reviews.reviews.length)
                                    .then(function() {

                                      // start querying the discovery result
                                      setTimeout(function(){
                                        watson.discoveryQuery(currentDiscoveryInfo)
                                          .then(function(output) {

                                            // store discovery results in cloudant
                                            insertDiscoveryInCloudant(output, reviewId)
                                            res.send(output);
                                          });
                                      }, 9000);
                                    });
                                  });
                              });
                          });
                      } else {

                        // else reviews are equal and
                        // we are assuming the reviews are the same and not modified
                        console.log('all of our reviews are already in the collection');
                        watson.discoveryQuery(currentDiscoveryInfo)
                          .then(function(output){

                            // store discovery results in cloudant
                            insertDiscoveryInCloudant(output, reviewId)
                            res.send(output);
                          });
                      }
                    }
                    else {

                      // else we are gonna delete the collections
                      console.log('collectionID != reviewID');
                      watson.deleteCollection(currentDiscoveryInfo)
                        .then(function(result) {

                          // get collection info
                          watson.getDiscoveryCollections(envID, configID, reviewId)
                            .then(function(currentDiscoveryInfo) {

                              // get the reviews in cloudant
                              getCloudantReviews(reviewId)
                                .then(function(reviews) {

                                  // start adding the reviews in cloudant to discovery collection
                                  console.log('number of reviews from cloudant ' +  reviews.reviews.length);
                                  watson.watsonAddDocument(reviews, currentDiscoveryInfo)
                                    .then(function() {

                                      // after adding the documents
                                      // query discovery collections
                                      setTimeout(function() {
                                        watson.discoveryQuery(currentDiscoveryInfo)
                                          .then(function(output) {

                                            // store discovery results in cloudant
                                            insertDiscoveryInCloudant(output, reviewId)
                                            res.send(output);
                                          });
                                      }, 7000);
                                    });
                                });
                            });
                        });
                    }
                  });
              });
            }
          }
          else {

            // if number of reviews from scrape and cloudant are not equal
            // would mean reviews are not synced; there are new reviews (or deleted? or unscraped? reviews)

            // scrape again
            scrapeNumberOfPages(reviewId)
              .then(scrapeEveryPage)
              .then(function (_options) {
                var cloudantDocument = {
                  _id: _options.productId,
                  productName: _options.productName,
                  reviews: _options.reviews,
                  _rev: options._rev
                };

                // add the document for the product with the reviews
                insertCloudantDoc(cloudantDocument)
                  .then(function (options) {
                    
                    // get collection info
                    watson.getDiscoveryCollections(envID, configID, reviewId)
                      .then(function(currentDiscoveryInfo) {

                        // then delete the collection
                        watson.deleteCollection(currentDiscoveryInfo)
                          .then(function(result) {

                            // get collection info
                            watson.getDiscoveryCollections(envID, configID, reviewId)
                              .then(function(currentDiscoveryInfo) {

                                // get the new set of reviews in cloudant
                                getCloudantReviews(reviewId)
                                  .then(function(reviews) {

                                    // start adding the reviews to discovery collection
                                    console.log('number of reviews from cloudant ' +  reviews.reviews.length);
                                    watson.watsonAddDocument(reviews, currentDiscoveryInfo)
                                      .then(function() {

                                        // after adding documents
                                        // query discovery results
                                        setTimeout(function() {
                                          watson.discoveryQuery(currentDiscoveryInfo)
                                            .then(function(output) {

                                              // store discovery results in cloudant
                                              insertDiscoveryInCloudant(output, reviewId)
                                              res.send(output);
                                            });                              
                                        }, 7000);
                                      });
                                  });
                              });
                          });          
                      });
                  });
              });
          }
        });
    }
    else {

      // if no document of product
      // start scraping the reviews
      console.log(reviewId + " document doesnt exist");
      scrapeNumberOfPages(reviewId)
        .then(scrapeEveryPage)
        .then(function (options) {
          var cloudantDocument = {
            _id: options.productId,
            productName: options.productName,
            reviews: options.reviews
          };
          insertCloudantDoc(cloudantDocument)
            .then(function (options) {

              // after inserting in cloudant
              // get collection info
              watson.getDiscoveryCollections(envID, configID, reviewId)
                .then(function(currentDiscoveryInfo) {

                  // delete the collection
                  // since this is a new scrape
                  watson.deleteCollection(currentDiscoveryInfo)
                    .then(function(result) {

                      // get collection info
                      watson.getDiscoveryCollections(envID, configID, reviewId)
                        .then(function(currentDiscoveryInfo){

                          // get the reviews in cloudant
                          getCloudantReviews(reviewId)
                            .then(function(reviews) {

                              // start adding the reviews to the dsicovery collection
                              console.log('number of reviews from cloudant ' +  reviews.reviews.length);
                              watson.watsonAddDocument(reviews, currentDiscoveryInfo)
                                .then(function() {

                                  // after adding documents
                                  // query discovery results
                                  setTimeout(function() {
                                    watson.discoveryQuery(currentDiscoveryInfo)
                                      .then(function(output) {

                                        // store discovery results in cloudant
                                        insertDiscoveryInCloudant(output, reviewId)
                                        res.send(output);
                                      }); 
                                  }, 7000);
                                });
                            });
                        });
                    });
                });
          });
        });
    }
  });
});

app.get('/cloudant/:reviewId', function(req, res) {
  getCloudantReviews(req.params.reviewId)
    .then(function (result) {
      res.send(result);
    });
});

app.get('/discoveries', function(req, res) {
  mydb.list(function(err, data) {
    if (err) {
      res.send(err)
    }
    else {
      res.send(data)
    }
  });
});

app.get('/discoveries/:reviewId', function(req, res) {
  getCloudantReviews(req.params.reviewId)
    .then(function (result) {
      res.send(result.watsonDiscovery);
    });
});

var port = process.env.PORT || 4000
app.listen(port, function() {
  console.log("Oder API service is in port: " + port);
});

/**
 * Scrape every page for the reviews
 * @param {object} options - product ID of Amazon Product found in URL
 * options = {
 * "totalPages": 30,
 * "productId": "B0123"
 * }
 * @return {Promise} - promise that is resolved when cloudscraper finishes
 * scraping every page
 * object resolved:
 * object = {
 * "productId":"B01M718E9X",
 * "productName":"Coffee Maker",
 * "reviews": [{"reviewer": "", "authorLink": "", "text": ""}]
 * }
 */
function scrapeEveryPage(options) {
  return new Promise(function (resolve,reject) {
    var arrayOfReviews = [];
    var totalReviews = 0;
    var page;
    var completedRequests = 0;
    for(page = 1; page < options.totalPages+1; page++) {
      cloudscraper.get(review_url + options.productId + review_page + page, function(error, response, body) {
        if (error) {
          console.log('Error occurred');
          reject(error);
        } else {
          var title = [];
          var review = [];
          var author = [];
          var authorLink = [];
          var rating = [];

          var $ = cheerio.load(body);
          $("a[class='a-size-base a-link-normal review-title a-color-base a-text-bold']").each(function(i, element){
              // console.log((i) + '==>' + $(this).text());
              title.push($(this).text());
          });
          $("span[class='a-size-base review-text']").each(function(i, element){
              // console.log((i) + '==>' + $(this).text());
              review.push($(this).text());
          });
          $("a[class='a-size-base a-link-normal author']").each(function(i, element){
              // console.log((i) + '==>' + $(this).text() + ' ' + $(this).attr('href'));
              author.push($(this).text());
              authorLink.push($(this).attr('href'));
          });
          $("span[class='a-icon-alt']").each(function(i, element) {
              var ratingFound = $(this).text();
              if (ratingFound != "|") {
                rating.push(ratingFound);
              }
          });
          for(var i = 0; i < 5; i++) {
            rating.pop();
          }
          rating.reverse();
          for(var i = 0; i < 3; i++) {
            rating.pop();
          }
          rating.reverse();
          for(i = 0; i < title.length; i++) {
            var JSONObjectReview = {};
            JSONObjectReview.reviewer = author[i];
            JSONObjectReview.authorLink = authorLink[i];
            JSONObjectReview.text = review[i];
            JSONObjectReview.title = title[i];
            JSONObjectReview.rating = parseInt(rating[i]);
            arrayOfReviews.push(JSONObjectReview);
          }

          completedRequests++;
          totalReviews += title.length;
          if (completedRequests == options.totalPages) {
            console.log('Total reviews parsed: ' + totalReviews);
            var object = {};
            object.productId = options.productId;
            object.productName = options.productName;
            object.reviews = arrayOfReviews;
            resolve(object);
          }
        }
      });
    }
  });
}

/**
 * Scrape for Number of Pages in first page
 * @param {String} productId - product ID of Amazon Product found in URL
 * @return {Promise} - promise that is resolved when cloudscraper returns
 * a result.
 * object resolved:
 * object = {
 * "productId" = "B0123",
 * "totalPages" : 30
 * }
 */
function scrapeNumberOfPages(productId) {
  return new Promise(function (resolve, reject) {
    cloudscraper.get(review_url + productId + review_page + 1, function(error, response, body) {
      if (error) {
          return console.error(error);
      } else {
        var pageList = [];
        var $ = cheerio.load(body);
        $("li[class='page-button']").each(function(i, element){
            pageList.push(parseInt($(this).text().replace(",","")));
        });
        var object = {};
        object.productName = $("title").text().replace("Amazon.com: Customer reviews: ","");
        console.log(object.productName + " <== GETTING REVIEWS OF");
        object.totalPages = pageList.pop();
        console.log('object.totalPages: ');
        console.log(object.totalPages);
        object.productId = productId;
        resolve(object);
      }
    });
  });
}

/**
 * Scrape for Number of Reviews in first page
 * @param {String} productId - product ID of Amazon Product found in URL
 * @return {Promise} - promise that is resolved when cloudscraper returns
 * a result.
 * object resolved:
 * object = {
 * "productId" = "B0123",
 * "numberOfReviews" : 3
 * }
 */
function scrapeNumberOfReviews(productId) {
  return new Promise(function (resolve, reject) {
    cloudscraper.get(review_url + productId + review_page + 1, function(error, response, body) {
      if (error) {
          return console.error(error);
      } else {
        var $ = cheerio.load(body);
        var numberOfReviews = $("span[class='a-size-medium totalReviewCount']").text().replace(",","");
        console.log(numberOfReviews + " reviews found in page");
        var object = {};
        object.numberOfReviews = parseInt(numberOfReviews);
        object.productId = productId;
        resolve(object);
      }
    });
  });
}

/**
 * Check if Cloudant Document already exists
 * @param {String} productId - product ID of Amazon Product found in URL
 * @return {Promise} - promise that is resolved when cloudant returns
 * a result.
 * Boolean is resolved
 */
function existingCloudantDoc(productId) {
  return new Promise(function (resolve, reject) {
    mydb.find({selector:{_id: productId}}, function (error, result) {
      if (error) {
        console.log(error);
      }
      else {
        resolve(result.docs.length > 0);
      }
    });
  });
}

/**
 * Check if number of reviews in cloudant document is equal to scraped number
 * @param {Object} options - contains the product ID and scraped number
 * options = {
 * "productId":"B0123"
 * "numberOfReviews": 23
 * }
 * @return {Promise} - promise that is resolved when cloudant returns
 * a result.
 * object resolved:
 * object = {
 * "isEqual": true,
 * "isReviewsEqualToDiscoveryDocuments": true
 * "_rev": ""
 * }
 * object.isEqualToScrape is a Boolean
 * object.isReviewsEqualToDiscoveryDocuments is Boolean
 */
function isNumberOfReviewsEqual(options) {
  return new Promise(function (resolve, reject) {
    mydb.find({selector:{_id: options.productId}}, function (error, result) {
      if (error) {
        console.log(error);
      }
      else {
        var object = {};
        object.isEqualToScrape = result.docs[0].reviews.length == options.numberOfReviews;
        object._rev = result.docs[0]._rev;
        object.CloudReviewsLen = result.docs[0].reviews.length;
        if (result.docs[0].hasOwnProperty("watsonDiscovery")) {
          object.isReviewsEqualToDiscoveryDocuments = object.CloudReviewsLen == result.docs[0].watsonDiscovery.matching_results;
        }
        else {
          object.isReviewsEqualToDiscoveryDocuments = false;
        }
        console.log(object._rev);
        console.log(result.docs[0].reviews.length + " in cloudant. " + options.numberOfReviews + " in scraping");
        resolve(object);
      }
    });
  });
}

/**
 * Inserting or Updating a Cloudant Document
 * @param {Object} doc - JSON to be saved in Cloudant
 * add _rev in {Object} doc for updating
 * @return {Promise} - promise that is resolved when cloudant document is saved
 */
function insertCloudantDoc(doc) {
  return new Promise(function (resolve, reject) {
    mydb.insert(doc, function (error, result) {
      if (error) {
        console.log(error);
      }
      console.log(result);
      resolve(result);
    });
  });
}

/**
 * Update a Cloudant Document with the discovery results
 * @param {Object} discoveryResult - JSON to be saved in Cloudant
 * - discoveryResult = is output of discoveryQuery in lib/watson.js
 * @param {String} = reviewId of the product;
 * @return {Promise} - promise that is resolved when cloudant document is saved
 */
function insertDiscoveryInCloudant(discoveryResult, reviewId) {
  return new Promise(function(resolve,reject) {
    getCloudantReviews(reviewId)
    .then(function(options) {
      var doc = options
      doc.watsonDiscovery = JSON.parse(discoveryResult)
      insertCloudantDoc(doc)
        .then(resolve)
    });
  })
}

/**
 * Getting the document in Cloudant
 * @param {String} productId - product ID of Amazon Product found in URL
 * @return {Promise} - promise that is resolved when cloudant returns
 * a result
 * object resolved:
 * object = {
 * "_id":"B01M718E9X",
 * "productName":"Coffee Maker",
 * "reviews": [{"reviewer": "", "authorLink": "", "text": ""}]
 * }
 */
function getCloudantReviews(productId) {
  return new Promise(function (resolve, reject) {
    mydb.find({selector:{_id: productId}}, function (error, result) {
      if (error) {
        reject(error);
      }
      else {
        var object = result.docs[0];
        resolve(object);
      }
    });
  });
}