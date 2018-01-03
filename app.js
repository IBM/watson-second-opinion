var request = require('request');
var cheerio = require('cheerio');
var cloudscraper = require('cloudscraper');
var express = require('express');
var Promise = require('promise');
var Cloudant = require('cloudant');
var app = express();
var review_url = "https://www.amazon.com/product-reviews/";
var review_page = "/ref=cm_cr_arp_d_paging_btm_2?pageNumber=";

var cloudantURL = process.env.CLOUDANT_URL;
var cloudant = Cloudant(cloudantURL, function(er, cloudant, reply) {
  if (er) {
    throw er;
  }
  console.log('Connected with username: %s', reply.userCtx.name);
});
var mydb = cloudant.db.use("products");

// Watson config
var Watson = require('./lib/watson.js')
var watson = new Watson()

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
          if (options.isEqual) {
            res.send("Query Watson Discovery if Collection for product exists.")
            // remove res.send and query if discovery collection exists
          }
          else {
            scrapeNumberOfPages(reviewId)
              .then(scrapeEveryPage)
              .then(function (_options) {
                var cloudantDocument = {
                  _id: _options.productId,
                  productName: _options.productName,
                  reviews: _options.reviews,
                  _rev: options._rev
                };
                insertCloudantDoc(cloudantDocument)
                  .then(function (options) {
                    res.send("Updated document in Cloudant");
                    // remove res.send and query watson discovery if collection exists
                  });
              })
          }
        });
    }
    else {
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
              res.send("Saved document in Cloudant");
              // remove res.send and create collecion in watson discovery
            })
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

            // WATSON FUNCTIONS
            // this should be in /reviews/:reviewIds
            // Getting environment config
            // watson.getDiscoveryEnvironments().then(function(result){
            //   var envID = result;
            //
            //   // Getting Discovery Configurations
            //   watson.getDiscoveryConfigurations(result).then(function(output){
            //     var configID = output
            //     // GETTING DISCOVERY COLLECTION  (One collection for one product?)
            //     watson.getDiscoveryCollections(envID, configID).then(function(output){
            //         // ADDING DOCUMENTS
            //         watson.watsonAddDocument(arrayOfReviews, output).then(function(){
            //           // console.log('about to get to setTimeout from app.js')
            //           setTimeout(function(){
            //             watson.discoveryQuery(output)
            //           }, 5000);
            //         });
            //     });
            //   })
            // })
            // END OF WATSON FUNCTIONS
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
            pageList.push(parseInt($(this).text()));
        });
        var object = {};
        object.productName = $("title").text().replace("Amazon.com: Customer reviews: ","");
        console.log(object.productName + " <== GETTING REVIEWS OF");
        object.totalPages = pageList.pop();
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
 * "_rev": ""
 * }
 * object.isEqual is a Boolean
 */
function isNumberOfReviewsEqual(options) {
  return new Promise(function (resolve, reject) {
    mydb.find({selector:{_id: options.productId}}, function (error, result) {
      if (error) {
        console.log(error);
      }
      else {
        var object = {};
        object.isEqual = result.docs[0].reviews.length == options.numberOfReviews;
        object._rev = result.docs[0]._rev;
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
