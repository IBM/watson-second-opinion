
/**
* Updates the UI to show accurate star ratings
* @param {object} results - an array of the reviews
* from the Amazon product
*/
function getStarRatings(results) {

  console.log('results: ')
  console.log(results)

  reviewsCont.innerHTML = '<center><h1><span id = "customerReviews">Customer reviews</span> </h1></center>';

  var userIcon = '<i id = "userIcon" class="fa fa-user-circle-o"></i>';

  for (var i = 0; i < 50; i++) {
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
function getInsights(data) {

  if (data.concepts.length === undefined) {
    console.log('no concepts!');
    showConcepts = false;
  } else {
    var conceptsLen = data.concepts.length;
    for (var i = 0; i < conceptsLen; i++) {
      pushToDict(conceptDict, data.concepts[i].text, data.concepts[i].relevance.toFixed(2))
    }
  }
  
  if (data.entities.length === undefined) {
    console.log('no concepts!');
    showEntities = false;
  } else {
    var entitiesLen = data.entities.length;
    for (var j = 0; j < entitiesLen; j++) {
      pushToDict(entitiesDict, data.entities[j].text, data.entities[j].relevance.toFixed(2))
    }
  } 

  if (data.keywords.length === undefined) {
    console.log('no concepts!');
    showKeywords = false;
  } else {
    var keywordLen = data.keywords.length;
    for (var k = 0; k < keywordLen; k++) {

      pushToDict(keywordDict, data.keywords[k].text, data.keywords[k].relevance.toFixed(2))
    }
  } 
}


/**
 * push metaData to dictionaries
 * @param {number} dict - dictionary to push to
 * @param {number} text - metadata
 * @param {number} relevance - score of 0-1 of how relevant
 */
function pushToDict(dict, text, relevance) {
  dict.push({
    text: text,
    relevance: relevance
  });
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
function buildChart(posPercent, negPercent, neuPercent) {

  var chart = AmCharts.makeChart("sentimentCont", {
    "type": "pie",
    "theme": "black",
    "titles": [
      {
        "text": "Sentiment Analysis",
        "size": 30,
        "color": "#9753e1",
        "bold": false
      }
    ],
    "dataProvider": [{
      "country": "Negative",
      "value": negPercent,
      "color": "#ff0000",
      "size": 30
    }, {
      "country": "Neutral",
      "value": neuPercent,
      "color": "#ffff00"
    }, {
      "country": "Positive",
      "value": posPercent,
      "color": "#64E572"
    }],
    "valueField": "value",
    "titleField": "country",
    "colorField": "color",
    "outlineAlpha": 0.4,
    // "depth3D": 30,
    "innerRadius": 30,
    "balloonText": "[[title]]<br><span style='font-size:20px'><b>[[value]]</b> ([[percents]]%)</span>",
    // "angle": 28.2,
    "hideCredits": true,
    "export": {
      "enabled": false
    }
  });
}

/**
 * Build a word cloud showing the insights
 * from customer reviews using zingChart library
 * @param  {object} dict - sorted dictionary
 * @param {string} Id - the id of the container to
 *
 */
function buildWordCloud(dict, container) {

  Object.keys(dict).forEach(function (key) {

    container.innerHTML += '<h4 id = "wordCloudContent">'
      + '<span id="keyword">' + dict[key]['text'] + '</span>'
      + '  ' + '<span id="numberOfKeywords">'
      + dict[key]["relevance"] + '  ' + '</span>' + '</h4>';
  });

}

/**
 * A descending sort of our dictonary. Used to order the
 * top keywords, entities, and related concepts.
 * @param {object} dict - an unsorted dictionary
 * containing the
 * @return {object} dict - returns a sorted dictionary
 */
function sort(dict) {
  dict.sort(function (a, b) {
    console.log('dict sort is being called')
    return (b.relevance) - (a.relevance);
  });
}