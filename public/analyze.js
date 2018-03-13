class Watson {

  discovery() {

    outputText.hidden = true;
    productName.hidden = true;
    data.url = document.getElementById("productUrl").value;
    var match = data.url.match(pattern);
    if (match == null) {
      outputText.hidden = false;
      sentimentCont.hidden = true;
      entitiesCont.hidden = true;
      keywordsCont.hidden = true;
      relatedConceptsCont.hidden = true;
      reviewsCont.hidden = true;
      outputText.innerHTML = "Please check your input is a valid Amazon product url";
      return;
    }
    loader.hidden = false;
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
    ourRequest.setRequestHeader('Content-type', 'application/json');
    ourRequest.onload = function () {
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

        productName.innerHTML = '<center>' + output.productName + '</center>';

        if (output.watsonDiscovery === undefined) {
          results = output.results;
        } else {
          results = output.watsonDiscovery.results;
        }

        //build the stars based on the reviews from the customers
        watson.getStarRatings(results);

        //go through all reviews and gather insights such as 
        //keywords, entities, and related concepts
        for (var i = 0; i < reviewLen; i++) {
          if (results[i].enriched_text !== undefined) {
            watson.getInsights(results[i].enriched_text);                    
          }
        }

        //round out percentages to make a simple pie chart
        var posPercent = Math.round(100 * (posCount / reviewLen));
        var negPercent = Math.round(100 * (negCount / reviewLen));
        var neuPercent = Math.round(100 * (neuCount / reviewLen));

        //get our pie circle chart to show reviews sentiment analysis  
        watson.buildChart(posPercent, negPercent, neuPercent);

        //sort our dictionaries in descending order for easy 
        //input to the word cloud
        if (entitiesDict !== undefined) {
          watson.sort(entitiesDict);
          entitiesDict = entitiesDict.slice(0, 15);
        }
        if (conceptDict !== undefined) {
          watson.sort(conceptDict);
          conceptDict = conceptDict.slice(0, 15);
          console.log('conceptDict')
          console.log(conceptDict)
          
        }
        if (keywordDict !== undefined) {
          watson.sort(keywordDict);
          keywordDict = keywordDict.slice(0, 15);
          
        }
        //determine if we show keywords or not
        if (showKeywords) {
          topKeywords.hidden = false;
          keywordsCont.hidden = false;          
          var keywordId = 'keywordsCont';
          watson.buildWordCloud(keywordDict, keywordId);
        } else {
          topKeywords.hidden = true;
          keywordsCont.hidden = true;
        }
        console.log('concepts!')
        console.log(conceptDict)
        //determine if we show related concepts or not
        if (showConcepts) {
          relatedConcepts.hidden = false;
          relatedConceptsCont.hidden = false;          
          var conceptsId = 'relatedConceptsCont';
          watson.buildWordCloud(conceptDict, conceptsId);
        } else {
          relatedConcepts.hidden = true;
          relatedConceptsCont.hidden = true;
        }

        if (showEntities) {
          topEntities.hidden = false;
          entitiesCont.hidden = false;          
          var entitiesId = 'entitiesCont';
          watson.buildWordCloud(entitiesDict, entitiesId);          
        } else {
          entitiesCont.hidden = true;
          topEntities.hidden = true;
        }
      }
      loader.hidden = true;
      sentimentCont.hidden = false;
      reviewsCont.hidden = false;
      productName.hidden = false;
    };
    ourRequest.send(json);
  }

   /**
 * Updates the UI to show accurate star ratings
 * @param {object} results - an array of the reviews
 * from the Amazon product 
 */
getStarRatings(results) {
  
      reviewsCont.innerHTML = '<center><h2>Customer reviews </h2></center>';
  
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
  
    }
  

  /**
* Updates the UI to show accurate star ratings
* @param {object} data - an array of the reviews
* from the Amazon product 
*/
  getInsights(data) {

    console.log(data)

    //check metadata of each individial review...i.e entities / keywords
    if (data.entities === undefined) {
      console.log('no keywords found')
      showEntities = false;
    } else {
      var entitiesLen = data.entities.length;
      if (entitiesLen > 0) {

        for (var j = 0; j < entitiesLen; j++) {
          var entity = data.entities[j].text;
          var count = data.entities[j].count;
          var add = true;
          if (entitiesDict.length <= 0) {
            entitiesDict.push({
              text: entity,
              count: count
            });
          } else {
            for (var k = 0; k < entitiesDict.length; k++) {
              if (entitiesDict[k].text === entity) {
                add = false;
                entitiesDict[k].count += count;
                break;
              }
            }
            if (add) {
              entitiesDict.push({
                text: entity,
                count: count
              });
            }
          }
        }
      }
    }
    //check for keyword. If we find them, put them into word cloud
    if (data.keywords === undefined) {
      console.log('no keywords found')
      showKeywords = false;
    } else {
      // var keywordCount = 1;
      var keywordsLen = data.keywords.length;
      if (keywordsLen > 0) {
        for (var j = 0; j < keywordsLen; j++) {
          var keyword = data.keywords[j].text;
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
    if (data.concepts === undefined) {
      console.log('no concepts found! found')
      showConcepts = false;
    } else {
      var conceptLen = data.concepts.length;
      if (conceptLen > 0) {
        for (var j = 0; j < conceptLen; j++) {
          var concept = data.concepts[j].text;
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

    //check sentiment analysis of every review, and keep 
    //track of them to show overall analysis in pie chart
    if (data.sentiment.document.label === 'positive') {
      posCount++;
    } else if (data.sentiment.document.label === 'negative') {
      negCount++;
    } else {
      neuCount++;
    }
  }

  /**
   * Output our circle graph showing the positive negative and
   * neutral sentiment of our reviews
   * @param {number} posPercent - this number represents the 
   * proprortion of positive reivews out of the total number 
   * of reviews uploaded
   * @param {number} negPercent - this number represents the 
   * proprortion of negative reivews out of the total number 
   * of reviews uploaded
   * @param {number} neuPercent - this number represents the 
   * proprortion of neutral reivews out of the total number 
   * of reviews uploaded
   * @return {Highchart object} - This function creates a 
   * Highchart object using the Highchart library. This 
   * object is a pie chart
   */
  buildChart(posPercent, negPercent, neuPercent) {

    var overallSentiment = '<h3>Reviews Analysis</h3>';

    Highcharts.setOptions({
      colors: ['#64E572', '#ffff00', '#ff0000']
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
  }

  /**
   * Build a word cloud showing the insights 
   * from customer reviews using zingChart library
   * @param  {object} dict - sorted dictionary
   * @param {string} Id - the id of the container to 
   * 
   */
  buildWordCloud(dict, Id) {
    var config = {
      type: 'wordcloud',
      FONTSIZE: '33',
      options: {
        "words": dict,
        minLength: 4
      }
    };

    zingchart.render({
      id: Id,
      data: config,
      height: 400,
      width: '100%'
    });
  }


  /**
   * A descending sort of our dictonary. Used to order the 
   * top keywords, entities, and related concepts.
   * @param {object} dict - an unsorted dictionary 
   * containing the 
   * @return {object} dict - returns a sorted dictionary
   */
  sort(dict) {
    dict.sort(function (a, b) {
      return (b.count) - (a.count);
    });
  }
}

let watson = new Watson();
var pattern = /(B[0-9]{2}[0-9A-Z]{7}|[0-9]{9}(?:X|[0-9]))/;

document.getElementById("goButton").addEventListener("click", watson.discovery);

var outputText = document.getElementById("discoveryQueryOutput"); //variable that will hold our final translation
var loader = document.getElementById("myLoader");
var sentimentCont = document.getElementById("sentimentCont");
var entitiesCont = document.getElementById("entitiesCont");
var keywordsCont = document.getElementById("keywordsCont");
var reviewsCont = document.getElementById("reviewsCont");
var relatedConceptsCont = document.getElementById("relatedConceptsCont");
var productName = document.getElementById("productName");
var topKeywords = document.getElementById("topKeywords");
var topEntities = document.getElementById("topEntities");
var relatedConcepts = document.getElementById("relatedConcepts");

var results;
var posCount = 0;
var neuCount = 0;
var negCount = 0;
var entityCount = 0;
var entitiesDict = [];
var keywordDict = [];
var conceptDict = [];
var data = {};
var showKeywords = true;
var showConcepts = true;
var showEntities = true;

outputText.hidden = true;
loader.hidden = true; //hide loader at the start of the app
sentimentCont.hidden = true;
entitiesCont.hidden = true;
keywordsCont.hidden = true;
relatedConceptsCont.hidden = true;
reviewsCont.hidden = true;
productName.hidden = true;







