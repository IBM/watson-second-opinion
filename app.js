var express = require('express');
var app = express();

// Watson config
var Watson = require('./lib/watson.js');
var watson = new Watson();

var CloudantDB = require('./lib/cloudant.js');
var cloudantDB = new CloudantDB();

var ScrapeData = require('./lib/scrapeData.js');
var scraper = new ScrapeData();

app.use(require('body-parser').json());

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/public'));

app.get('/reviews/:reviewId', function (req, res, next) {
  var reviewId = req.params.reviewId;
  return cloudantDB.existingCloudantDoc(reviewId)
    .then(function(docExists){
      console.log('docExists: ');
      console.log(docExists);
      scraper.scrapeNumberOfPages(reviewId)
        .then(function(options){
        // console.log(options)
          return scraper.scrapeEveryPage(options);
        })
        .then(function(options){
          console.log(options);
          var cloudantDocument = {
            _id: options.productId,
            productName: options.productName,
            starRating: options.starRating,
            reviews: options.reviews,
            img: options.img
          };
          return cloudantDB.insertCloudantDoc(cloudantDocument);
        })
        .then(function(){
          return cloudantDB.getCloudantReviews(reviewId);
        })
        .then(function(reviews){
          console.log('right after cloudantDB get cloudant reviews');
          // console.log(reviews)
          return watson.getSecondOpinion(reviews);
        })
        .then(function(opinion){
          // console.log('before res.send')
          res.send(opinion);
        })
        .catch(next);
    });
});

app.get('/cloudant/:reviewId', function (req, res, next) {
  console.log('GET request to cloudant/reviewId');
  cloudantDB.getCloudantReviews(req.params.reviewId)
    .then(function (result) {
      console.log(result);
      return res.send(result);
    })
    .catch(next);
});

var port = process.env.PORT || 4000;
app.listen(port, function () {
  console.log('Oder API service is in port: ' + port);
  cloudantDB.createDB();
});
