// var ProgressBar = require('progressbar.js');

class Watson{

  discovery(){
    var showKeywords = true;
    var showConcepts = true;
    var posCount = 0;
    var neuCount = 0;
    var negCount = 0;
    var entityCount = 0;
    var sentimentWeightedScoreSum = 0;
    outputText.hidden = true;
    productName.hidden = true;
    data.url = document.getElementById("productUrl").value;
    var match = data.url.match(pattern);
    if(match == null){
      outputText.hidden = false;
      sentimentRating.hidden = true;
      sentimentCont.hidden = true;
      entitiesCont.hidden = true;
      keywordsCont.hidden = true; 
      relatedConceptsCont.hidden = true;     
      reviewsCont.hidden = true; 
      outputText.innerHTML = "Please check your input is a valid Amazon product url";
      return;
    }
    loader.hidden = false;
    sentimentRating.hidden = true;
    sentimentCont.hidden = true;
    entitiesCont.hidden = true;
    reviewsCont.hidden = true;
    keywordsCont.hidden = true;
    relatedConceptsCont.hidden = true;
    data.source = match[0];
    var nodeUrl = 'reviews/' + data.source;
    var json = JSON.stringify(data);
    var ourRequest = new XMLHttpRequest();
    ourRequest.open("GET", nodeUrl, true);
    ourRequest.setRequestHeader('Content-type','application/json');
    ourRequest.onload = function() {
      if (ourRequest.status == 400) {
        outputText.innerHTML = "Error, check your network connection.";
      }
      else {
        var output = JSON.parse(ourRequest.responseText);
        console.log('output: ')
        console.log(output);
        var reviewLen;
        if (output.matching_results === undefined) {
          reviewLen = output.reviews.length;
        } else {
          reviewLen = output.matching_results;
        }

        productName.innerHTML = '<center><h1>' + output.productName + '</h1></center>';
        
        var results;

        if (output.watsonDiscovery === undefined) {
          results = output.results;
        } else {
          results = output.watsonDiscovery.results;
        }

        reviewsCont.innerHTML = '<center><h2>Customer reviews </h2></center>';

        //go through all the reviews.
        for (var i = 0; i < reviewLen; i++) {
          //check metadata of each individial review...i.e entities / keywords

          if (results[i].enriched_text !== undefined) {
            var entitiesLen = results[i].enriched_text.entities.length;
            if (entitiesLen > 0) {
              var dict = [];
              var dictLenght = dict.length;

              for (var j = 0; j < entitiesLen; j++) {
                var entity = results[i].enriched_text.entities[j].text;
                var count = results[i].enriched_text.entities[j].count;
                var add = true;
                if (dict.length <= 0) {
                  dict.push({
                    text: entity,
                    count: count
                  });
                } else {
                  for (var k = 0; k < dict.length; k++) {
                    if (dict[k].text === entity) {
                      add = false;
                      dict[k].count += count;
                      break;
                    }
                  }
                  if (add) {
                    dict.push({
                      text: entity,
                      count: count
                    });
                  }
                }
              }
            }
            //check for keyword. If we find them, put them into word cloud
            if (results[i].enriched_text.keywords === undefined) {
              console.log('no keywords found')
              showKeywords = false;
            } else {
              var keywordDict = [];
              var keywordsLen = results[i].enriched_text.keywords.length;
              if (keywordsLen > 0) {
                for (var j = 0; j < keywordsLen; j++) {
                  var keyword = results[i].enriched_text.keywords[j].text;
                  var count = 1;
                  var add = true;
                  if (keywordDict.length <= 0) {
                    keywordDict.push({
                      text: keyword,
                      count: count
                    });
                  } else {
                    for (var k = 0; k < keywordDict.length; k++) {
                      if (keywordDict[k].text === keyword) {
                        add = false;
                        keywordDict[k].count += count;
                        break;
                      }
                    }
                    if (add) {
                      keywordDict.push({
                        text: keyword,
                        count: count
                      });
                    }
                  }
                }
              }
            }
            //check for related concepts, if we have some, put them into word cloud
            if (results[i].enriched_text.concepts === undefined) {
              console.log('no concepts found! found')
              showConcepts = false;
            } else {
              var conceptDict = [];
              var conceptLen = results[i].enriched_text.concepts.length;
              if (conceptLen > 0) {
                for (var j = 0; j < conceptLen; j++) {
                  var concept = results[i].enriched_text.concepts[j].text;
                  var count = 1;
                  var add = true;
                  if (conceptDict.length <= 0) {
                    conceptDict.push({
                      text: concept,
                      count: count
                    });
                  } else {
                    for (var k = 0; k < conceptDict.length; k++) {
                      if (conceptDict[k].text === concept) {
                        add = false;
                        conceptDict[k].count += count;
                        break;
                      }
                    }
                    if (add) {
                      conceptDict.push({
                        text: concept,
                        count: count
                      });
                    }
                  }
                }
              }
            }

            if (results[i].enriched_text.sentiment.document.label === 'positive') {
              posCount++;
            } else if (results[i].enriched_text.sentiment.document.label === 'negative') {
                negCount++;
            } else {
              neuCount++;
            }

            // console.log(results[i].enriched_text.sentime)

            // bottom/top weighted sentiment to star rating mapping
            if (results[i].enriched_text.sentiment.document.score >= 0) {
              sentimentWeightedScoreSum +=
              (Math.sqrt(results[i].enriched_text.sentiment.document.score) * 2) + 3;
            }
            else {
              sentimentWeightedScoreSum +=
              (-1*Math.sqrt(Math.abs(results[i].enriched_text.sentiment.document.score)) * 2) + 3;
            }

          }

        }

        console.log('keywordDict: ')
        console.log(keywordDict)

        if (dict !== undefined) {
          watson.sort(dict);
        }
        if (conceptDict !== undefined) {
          watson.sort(conceptDict)
        }
        if (keywordDict !== undefined) {
          watson.sort(keywordDict)
        }

        var userIcon = '<i id = "userIcon" class="fa fa-user-circle-o"></i>';

        for (var i = 0; i < results.length; i++) {
          reviewsCont.innerHTML += userIcon + '<p>' + results[i].reviewer + '</p>';

          reviewsCont.innerHTML +=
          '<div class="stars-outer">' +
          '<p id = "rating">' + 'Rating: ' + '</p>';
          var numberOfStars = 0;
          var starsContent = "";
          while (numberOfStars < results[i].rating) {
            starsContent += "&#xf005 ";
            numberOfStars++;
          }
          while (numberOfStars < 5) {
            starsContent += "&#xf006 ";
            numberOfStars++;
          }
          reviewsCont.innerHTML += '<div class="stars-inner fa">' + starsContent + '</div></div>';


          reviewsCont.innerHTML += '<p id = "reviewText">' + '<p><b>' +
            results[i].title + ' - ' + ' </b>' + results[i].text + '<br></p>';
        }

        var posPercent = Math.round(100*(posCount / reviewLen));
        var negPercent = Math.round(100*(negCount / reviewLen));
        var neuPercent = Math.round(100*(neuCount / reviewLen));

        var sentimentWeightedScore = (sentimentWeightedScoreSum / reviewLen);

        sentimentRating.innerHTML = '<center><h2>Sentiment Weighted Rating: ' + sentimentWeightedScore.toString().substring(0,3) + ' stars</h2></center>';


        console.log('Sentiment weighted score: ');
        console.log(sentimentWeightedScore);

        var generalSent = posPercent - negPercent;
        var overallSentiment = '';

        console.log('posPercent: ')
        console.log(posPercent)

        var overallSentiment = '<h3>Reviews Analysis</h3>';

        Highcharts.setOptions({
          colors: ['#64E572', '#ffff00','#ff0000']
        });

        var graph = Highcharts.chart('sentimentCont', {
          chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 0,
            plotShadow: false,
            type: 'pie'
          },
          title: {
            text: overallSentiment
          },
          tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:1.0f}%</b>'
          },
          plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:1.0f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
          series: [{
            type: 'pie',
            name: 'Review Sentiment',
            innerSize: '50%',
            data: [
              ['Positive', posPercent],
              ['Neutral', neuPercent],
              ['Negative', negPercent],
              {
                name: 'Proprietary or Undetectable',
                y: 0.2,
                dataLabels: {
                  enabled: false
                }
              }
              ]
              }]
          });

          console.log(dict)

          //determine if we show keywords or not
          if (showKeywords) {
            topKeywords.hidden = false;
            var myKeywordConfig = {
              type: 'wordcloud',
              options: {
                "words": keywordDict,
                minLength: 4
              }
            };

            var poop = zingchart.render({
              id: 'keywordsCont',
              data: myKeywordConfig,
              height: 400,
              width: '100%'
            });
          } else {
            topKeywords.hidden = true;
            keywordsCont.hidden = true;
          }

          console.log('concepts!')
          console.log(conceptDict)
          //determine if we show related concepts or not
          if (showConcepts) {
            relatedConcepts.hidden = false;
            var myConceptConfig = {
              type: 'wordcloud',
              options: {
                "words": conceptDict,
                minLength: 4
              }
            };

            var emoji = zingchart.render({
              id: 'relatedConceptsCont',
              data: myConceptConfig,
              height: 400,
              width: '100%'
            });
          } else {
            relatedConcepts.hidden = true;
            relatedConceptsCont.hidden = true;
          }


          var myEntitiesConfig = {
            type: 'wordcloud',
            options: {
              "words": dict,
              minLength: 4
            }
          };

          var something = zingchart.render({
            id: 'entitiesCont',
            data: myEntitiesConfig,
            height: 400,
            width: '100%'
          });

      }
      // outputText.hidden = false;
      loader.hidden = true;
      sentimentRating.hidden = false;
      sentimentCont.hidden = false;
      entitiesCont.hidden = false;
      if (showKeywords) {
        keywordsCont.hidden = false;
      }
      if (showConcepts) {
        relatedConceptsCont.hidden = false;
      }

      reviewsCont.hidden = false;
      productName.hidden = false;
    };
    ourRequest.send(json);
  }

  sort(dict) {
    dict.sort(function(a, b) {
      return (b.count) - (a.count);
    });
  }

}

let watson = new Watson();
var pattern = /(B[0-9]{2}[0-9A-Z]{7}|[0-9]{9}(?:X|[0-9]))/;

document.getElementById("goButton").addEventListener("click", watson.discovery);

var outputText = document.getElementById("discoveryQueryOutput"); //variable that will hold our final translation
var loader = document.getElementById("myLoader");
var sentimentRating = document.getElementById("sentimentRating");
var sentimentCont = document.getElementById("sentimentCont");
var entitiesCont = document.getElementById("entitiesCont");
var keywordsCont = document.getElementById("keywordsCont");
var reviewsCont = document.getElementById("reviewsCont");
var relatedConceptsCont = document.getElementById("relatedConceptsCont");
var productName = document.getElementById("productName");
var topKeywords = document.getElementById("topKeywords");
var relatedConcepts = document.getElementById("relatedConcepts");

var data = {};

outputText.hidden = true;
loader.hidden = true; //hide loader at the start of the app
sentimentRating.hidden = true;
sentimentCont.hidden = true;
entitiesCont.hidden = true;
keywordsCont.hidden = true;
relatedConceptsCont.hidden = true;
reviewsCont.hidden = true;
productName.hidden = true;
