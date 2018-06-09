/* global reviewsCont, keywordDict, conceptDict, entitiesDict, buildCharts */

/**
* Updates the UI to show accurate star ratings
* @param {object} results - an array of the reviews
* from the Amazon product
*/
function getStarRatings(results) {

  console.log('results: ');
  console.log(results);

  reviewsCont.innerHTML = '<center><h2><span id = "customerReviews">Customer Reviews</span> </h2></center>';
  var userIcon = '<i id = "userIcon" class="fas fa-user"></i>';

  //only display 10 reviews max
  if (results.length > 10) {
    results = results.slice(0, 10);
  }

  for (var i = 0; i < results.length; i++) {
    reviewsCont.innerHTML += userIcon + '<p>' + results[i].reviewer + '</p>';

    reviewsCont.innerHTML +=
      '<div class="stars-outer">' +
      '<p id = "rating">' + 'Rating: ' + '</p>';
    var numberOfStars = 0;
    var starsContent = '';
    while (numberOfStars < results[i].rating) {
      starsContent += '<i class="fas fa-star"></i> ';
      numberOfStars++;
    }
    while (numberOfStars < 5) {
      starsContent += '<i class="far fa-star"></i> ';
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
function getNLUData(data) {

  if (data.concepts.length === undefined) {
    console.log('no concepts!');
  } else {
    var conceptsLen;
    if (data.concepts.length > 10) {
      conceptsLen = 10;
    } else {
      conceptsLen = data.concepts.length;
    }
    for (var i = 0; i < conceptsLen; i++) {
      pushToDict(conceptDict, data.concepts[i].text, data.concepts[i].relevance.toFixed(2));
    }
  }

  if (data.entities.length === undefined) {
    console.log('no concepts!');
  } else {
    var entitiesLen;
    if (data.entities.length > 10) {
      entitiesLen = 10;
    } else {
      entitiesLen = data.entities.length;
    }
    for (var j = 0; j < entitiesLen; j++) {
      pushToDict(entitiesDict, data.entities[j].text, data.entities[j].relevance.toFixed(2));
    }
  }

  if (data.keywords.length === undefined) {
    console.log('no concepts!');
  } else {
    var keywordLen;
    if (data.keywords.length > 15) {
      keywordLen = 15;
    } else {
      keywordLen = data.keywords.length;
    }
    for (var k = 0; k < keywordLen; k++) {
      pushToDict(keywordDict, data.keywords[k].text, data.keywords[k].relevance.toFixed(2));
    }
  }
}

/**
 * modify overall sentiment
 * @param {number} sentimentPercent - the percent of overall positive sentiment 
 * This function modifies the sentiment bar as needed.
 */
function showSentiment(sentimentPercent, querySelector) {
  setTimeout(function(){ 
    
    console.log('query selector: ');
    console.log(querySelector);
    var barInner = [].slice.call(document.querySelectorAll(querySelector));

    barInner.map(function (bar) {
      bar.dataset.percent = sentimentPercent.toFixed(0) + '%';
      bar.style.width = bar.dataset.percent;
    });
  }, 0);

}

/**
 * Build a word cloud showing the insights
 * from customer reviews using zingChart library
 * @param  {object} dict - sorted dictionary
 * @param {string} Id - the id of the container to
 *
 */
/* exported buildCharts */
function buildCharts(dict, container, bar) {

  var i = 0;

  Object.keys(dict).forEach(function (key) {
    //give each bar a different id to select it 
    if (bar.includes('.')) {
      bar = bar.slice( 1 );
    }
    bar = bar + i;

    container.innerHTML += '<h4 id = "wordCloudContent">'
      + '<span id="keyword">' + dict[key]['text'] + '</span>' 
      //create div on the fly to be able to add relevance percentage
      + '<div class="bar"><div class=' + bar + ' data-percent="30%"></div></div></h4>';

    var relevance = dict[key]['relevance'] * 100;

    if (!bar.includes('.')) {
      bar = '.' + bar ;
      console.log('after adding . :');
      console.log(bar); 
    }

    showSentiment(relevance, bar);
    i++;
  });  

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
 * A descending sort of our dictonary. Used to order the
 * top keywords, entities, and related concepts.
 * @param {object} dict - an unsorted dictionary
 * containing the
 * @return {object} dict - returns a sorted dictionary
 */
function sort(dict) {
  dict.sort(function (a, b) {
    console.log('in the process of sorting');
    return (b.relevance) - (a.relevance);
  });
}