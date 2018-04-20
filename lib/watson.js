var jsonfile = require('jsonfile');
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
config = jsonfile.readFileSync(__dirname + '/../config.json' );

var watsonNLU = new NaturalLanguageUnderstandingV1({
  'username': config.nluUsername,
  'password': config.nluPassword,
  version_date: '2018-03-16'
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
      console.log('reviews from getSecondOpinion: ');
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
            reject(error);          
          } else {
            console.log('stringify')
            console.log(JSON.stringify(opinion, null, 2));
            opinion.reviews = reviews; 
            if (opinion.keywords.length === 0 && opinion.entities.length === 0 && opinion.sentiment === undefined && opinion.concepts.lenght === 0 ) {
              reject(error);            
            } else {
              resolve(opinion);
            }         
          }
        });
      } else {
        reject('no reviews received');
      }
    });
  }
}

module.exports = Watson;