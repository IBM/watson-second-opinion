var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

var watsonNLU = new NaturalLanguageUnderstandingV1({
  'iam_apikey': process.env.IAM_APIKEY,
  'version': '2018-11-16'
});

class Watson {

  /**
   * Proccess text with NLU.
   * @return {Promise} - promise that returns an response object
   * object resolved:
   * opinion = {
   * keywords:
   *  [ { text: 'American multinational technology',,
   *  entities:
   *  [ { type: 'Company',
   *   ] }  
   * }
   */

  getSecondOpinion(reviews) {
    return new Promise((resolve, reject) => {
      // console.log('reviews from getSecondOpinion: ');
      // console.log(reviews)
      if (reviews.reviews.length > 0) {
        var reviewStr = '';
        for (var i = 0; i < reviews.reviews.length; i++) {
          reviewStr += ' ' + reviews.reviews[i].text;
        }

        var parameters = {
          'text': reviewStr,
          'features': {
            'entities': {
              'emotion': true,
              'sentiment': true,
              'limit': 20
            },
            'keywords': {
              'emotion': true,
              'sentiment': true,
              'limit': 30
            },
            'concepts': {
              'emotion': true,
              'sentiment': true,
              'limit': 20
            },
            'sentiment': {
              'emotion': true,
              'sentiment': true,
              'limit': 1
            }
          }
        };

        watsonNLU.analyze(parameters, function(err, opinion) {
          if (err) {
            console.log('err: ');
            console.log(err);
            reject(err);          
          } else {
            // console.log(JSON.stringify(opinion, null, 2));
            opinion.reviews = reviews; 
            if (opinion.keywords.length === 0 && opinion.entities.length === 0 && opinion.sentiment === undefined && opinion.concepts.lenght === 0 ) {
              reject(err);            
            } else {
              resolve(opinion);
            }         
          }
        });
      } else {
        reject('This product does not have any reviews to analyze!');
      }
    });
  }
}

module.exports = Watson;