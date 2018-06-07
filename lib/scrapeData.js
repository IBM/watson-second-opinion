var cloudscraper = require('cloudscraper');
var cheerio = require('cheerio');

var review_url = 'https://www.amazon.com/product-reviews/';
var review_page = '/ref=cm_cr_arp_d_paging_btm_2?pageNumber=';

class ScrapeData {

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
  scrapeEveryPage(options) {
    return new Promise(function (resolve, reject) {
      console.log(options);
      var arrayOfReviews = [];
      var totalReviews = 0;
      var page;
      var completedRequests = 0;
      if (options.totalPages > 20) {
        console.log('setting total pages to 20');
        options.totalPages = 20;
      }


      for (page = 1; page < options.totalPages + 1; page++) {
        cloudscraper.get(review_url + options.productId + review_page + page, function (error, response, body) {
          if (error) {
            console.log('Error occurred');
            console.log(error);
            reject(error);
          } else {
            var title = [];
            var review = [];
            var author = [];
            var authorLink = [];
            var rating = [];
            var img = [];

            var $ = cheerio.load(body);

            $("a[class='a-size-base a-link-normal review-title a-color-base a-text-bold']").each(function () {
              // console.log((i) + '==>' + $(this).text());
              title.push($(this).text());
            });
            $("span[class='a-size-base review-text']").each(function () {
              // console.log((i) + '==>' + $(this).text());
              review.push($(this).text());
            });
            $("a[class='a-size-base a-link-normal author']").each(function () {
              // console.log((i) + '==>' + $(this).text() + ' ' + $(this).attr('href'));
              author.push($(this).text());
              authorLink.push($(this).attr('href'));
            });
            $("span[class='a-icon-alt']").each(function () {
              var ratingFound = $(this).text();
              if (ratingFound != '|') {
                rating.push(ratingFound);
              }
            });
            for (var i = 0; i < 5; i++) {
              rating.pop();
            }
            rating.reverse();
            for (var j = 0; j < 3; j++) {
              rating.pop();
            }
            rating.reverse();
            for (i = 0; i < title.length; i++) {
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

              //scrape all images on the site, and find one that shows product id
              $('img').each(function (i, image) {
                var imag = $(image).attr('src');
                // need to cut https://m.media-amazon.com/images/I/417WI5ELeyL._AC_US60_SCLZZZZZZZ__.jpg 
                // to https://m.media-amazon.com/images/I/417WI5ELeyL.jpg bc the 2nd pic is much larger
                // split string by periods, then add it back up without the _AC_... part. 
                if (imag.includes('_AC_')) {
                  var res = imag.split('.');
                  //console.log(res)
                  res = res[0] + '.' + res[1] + '.' + res[2] + '.' + res[4];
                  //console.log(res)
                  img = res;
                  return false;
                }
              });

              console.log('Total reviews parsed: ' + totalReviews);
              var object = {};
              object.productId = options.productId;
              object.productName = options.productName;
              object.starRating = options.starRating;
              object.reviews = arrayOfReviews;
              object.img = img;
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
  scrapeNumberOfPages(productId) {
    return new Promise(function (resolve, reject) {
      cloudscraper.get(review_url + productId + review_page + 1, function (error, response, body) {
        if (error) {
          console.log('getting error with scraping');
          reject(error);
        } else {
          var pageList = [];
          var $ = cheerio.load(body);
          $("li[class='page-button']").each(function () {
            pageList.push(parseInt($(this).text().replace(',', '')));
          });
          var starRating = $("span .arp-rating-out-of-text").text();
          console.log(starRating);

          var object = {};
          object.productName = $("title").text().replace("Amazon.com: Customer reviews: ", "");
          object.starRating = starRating;
          // object.image = img;
          console.log(object.productName + ' <== GETTING REVIEWS OF');
          object.totalPages = pageList.pop();
          if (object.totalPages == undefined)
            object.totalPages = 1;
          console.log('object.totalPages: ');
          console.log(object.totalPages);
          object.productId = productId;
          resolve(object);
        }
      });
    });
  }
}

module.exports = ScrapeData;