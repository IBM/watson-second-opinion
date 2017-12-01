var request = require('request');
var cheerio = require('cheerio');
var cloudscraper = require('cloudscraper');
var express = require('express');
var Promise = require('promise');
var app = express();
var review_url = "https://www.amazon.com/product-reviews/";
var review_page = "/ref=cm_cr_arp_d_paging_btm_2?pageNumber=";


app.use(require('body-parser').json());

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/public'));

app.get('/reviews/:reviewId', function(req, res) {
  var _arrayOfReviews = [];
  //number of pages
  cloudscraper.get(review_url + req.params.reviewId + review_page + 1, function(error, response, body) {
    if (error) {
        return console.error(error);
    } else {
        var pageList = [];
        var $ = cheerio.load(body);
        $("li[class='page-button']").each(function(i, element){
            pageList.push(parseInt($(this).text()));
        });
        var numberOfPages = pageList.pop();
        scrapeEveryPage(numberOfPages, _arrayOfReviews, req.params.reviewId).then(function (options) {
            res.send(options);
        });
    }
  });
});

var port = process.env.PORT || 8080
app.listen(port, function() {
    console.log("Oder API service is in port: " + port);
});

function scrapeEveryPage(totalPages, arrayOfReviews, productId) {
    return new Promise(function (resolve,reject) {
        var totalReviews = 0;
        var page;
        var completedRequests = 0;
        for(page = 1; page < totalPages+1; page++) {
            cloudscraper.get(review_url + productId + review_page + page, function(error, response, body) {
              if (error) {
                  console.log('Error occurred');
                  reject(error);
              } else {

                  var title = [];
                  var review = [];
                  var author = [];
                  var authorLink = [];
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
                  for(i = 0; i < title.length; i++) {
                      var JSONObjectReview = {reviewer:'',text:'',title:''};
                      JSONObjectReview.reviewer = author[i];
                      JSONObjectReview.text = review[i];
                      JSONObjectReview.title = title[i];
                      arrayOfReviews.push(JSONObjectReview);
                  }
                  completedRequests++;
                  totalReviews += title.length;
                  if (completedRequests == totalPages) {
                      console.log('Total reviews parsed: ' + totalReviews);
                      resolve(JSON.stringify(arrayOfReviews));
                  }
              }
            })
        }
    })

}
