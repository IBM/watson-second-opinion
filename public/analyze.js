class Watson {
  
    discovery() {
      outputText.hidden = true;
      productName.hidden = true;
      productHeader.hidden = true;    
      data.url = document.getElementById("productUrl").value;
      var match = data.url.match(pattern);
      if (match == null) {
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
  
      //clear the keywords from the previous query
      keywordsCont.innerHTML = '<center> <h2 id="topKeywords">Top Keywords</h2>' 
        + '<h3 id="keywordDescription">Most common keywords extracted from customer reviews.</h3> </center>';
  
      entitiesCont.innerHTML = '<center> <h2 id="topEntities">Top Entities</h2>'
        + '<h3 id="entityDescription">Most common people, companies, organization, and cities extracted from custmer reviews.</h3> </center>';
      
      relatedConceptsCont.innerHTML = '<center> <h2 id="relatedConcepts">Related Concepts</h2>'
        + '<h3 id="conceptsDescription">General concepts that are not necessarily referenced in your data.</h3></center>';
      
      loader.hidden = false;
      sentimentRating.hidden = true;
      sentimentCont.hidden = true;
      entitiesCont.hidden = true;
      reviewsCont.hidden = true;
      keywordsCont.hidden = true;
      relatedConceptsCont.hidden = true;
      console.log('data.source: ')
      console.log(match)
      data.source = match[0];
      var nodeUrl = 'reviews/' + data.source;
      // var nodeUrl = 'https://2ndopinion.mybluemix.net/reviews/' + data.source;
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
  
          productHeader.innerHTML = '<b>' + 'Showing results for: </b>';
          
          productName.innerHTML = '"<i>' + output.productName + '</i>"';
  
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
              watson.getInsights(results[i]);
            }
          }
  
          //round out percentages to make a simple pie chart
          var posPercent = Math.round(100 * (posCount / reviewLen));
          var negPercent = Math.round(100 * (negCount / reviewLen));
          var neuPercent = Math.round(100 * (neuCount / reviewLen));
  
          var sentimentWeightedScore = (sentimentWeightedScoreSum / reviewLen);
  
          var amazonScrapeRating = output.starRating.substring(0,3)
          
          sentimentRating.innerHTML = '<h2> <span id = "amazonRating">Amazon Rating: ' 
            + '<span style="font-weight: bold; ">' + amazonScrapeRating + '</span>'
            + ' stars' + '</span>' +  ' <br>'
            + '<span id = "sentimentRating">' 
            + '<a href="https://www.ibm.com/watson/developer/"> Watson </a>' +  ' Rating: '
            + '<span style="font-weight: bold; ">'
            + sentimentWeightedScore.toString().substring(0,3) + '</span>' 
            + ' stars</span></h2>';
  
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
            keywordDict = keywordDict.slice(0, 40);
  
          }
          //determine if we show keywords or not
          if (showKeywords) {
            topKeywords.hidden = false;
            keywordsCont.hidden = false;
            var keywordId = 'keywordsCont';
            watson.buildWordCloud(keywordDict, keywordsCont);
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
            watson.buildWordCloud(conceptDict, relatedConceptsCont);
          } else {
            relatedConcepts.hidden = true;
            relatedConceptsCont.hidden = true;
          }
  
          if (showEntities) {
            topEntities.hidden = false;
            entitiesCont.hidden = false;
            var entitiesId = 'entitiesCont';
            watson.buildWordCloud(entitiesDict, entitiesCont);
          } else {
            entitiesCont.hidden = true;
            topEntities.hidden = true;
          }
        }
        loader.hidden = true;
        sentimentCont.hidden = false;
        reviewsCont.hidden = false;
        productName.hidden = false;
        productHeader.hidden = false;      
        sentimentRating.hidden = false;
        posCount = 0;
        neuCount = 0;
        negCount = 0;
        sentimentWeightedScoreSum = 0;
      };
      ourRequest.send(json);
    }
  
     /**
   * Updates the UI to show accurate star ratings
   * @param {object} results - an array of the reviews
   * from the Amazon product
   */
  getStarRatings(results) {
  
        reviewsCont.innerHTML = '<center><h1><span id = "customerReviews">Customer reviews</span> </h1></center>';
  
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
      //check metadata of each individial review...i.e entities / keywords
      if (data.enriched_text.entities === undefined) {
        console.log('no keywords found')
        showEntities = false;
      } else {
        var entitiesLen = data.enriched_text.entities.length;
        if (entitiesLen > 0) {
  
          for (var j = 0; j < entitiesLen; j++) {
            var entity = data.enriched_text.entities[j].text;
            var count = data.enriched_text.entities[j].count;
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
      if (data.enriched_text.keywords === undefined) {
        console.log('no keywords found')
        showKeywords = false;
      } else {
        // var keywordCount = 1;
        var keywordsLen = data.enriched_text.keywords.length;
        if (keywordsLen > 0) {
          for (var j = 0; j < keywordsLen; j++) {
            var keyword = data.enriched_text.keywords[j].text;
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
      if (data.enriched_text.concepts === undefined) {
        console.log('no concepts found! found')
        showConcepts = false;
      } else {
        var conceptLen = data.enriched_text.concepts.length;
        if (conceptLen > 0) {
          for (var j = 0; j < conceptLen; j++) {
            var concept = data.enriched_text.concepts[j].text;
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
      //add sentiment star rating to compare to Amazon rating
      if (data.enriched_text.sentiment.document.score >= 0) {
        sentimentWeightedScoreSum +=
        (Math.sqrt(data.enriched_text.sentiment.document.score) * 2) + 3;
      }
      else {
        sentimentWeightedScoreSum +=
        (-1*Math.sqrt(Math.abs(data.enriched_text.sentiment.document.score)) * 2) + 3;
      }
  
      //build pie chart of reviews analysis
      if (data.enriched_text.sentiment.document.label === 'positive') {
        posCount++;
      } else if (data.enriched_text.sentiment.document.label === 'negative') {
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
  
      var chart = AmCharts.makeChart( "sentimentCont", {
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
        "dataProvider": [ {
          "country": "Negative",
          "value": negPercent,
          "color":"#ff0000",
          "size": 30        
        }, {
          "country": "Neutral",
          "value": neuPercent,
          "color":"#ffff00"        
        }, {
          "country": "Positive",
          "value": posPercent,
          "color":"#64E572"
        }],
        "valueField": "value",
        "titleField": "country",
        "colorField": "color",
        "outlineAlpha": 0.4,
        // "depth3D": 30,
        "innerRadius": 30,
        "balloonText": "[[title]]<br><span style='font-size:20px'><b>[[value]]</b> ([[percents]]%)</span>",
        // "angle": 28.2,
        "hideCredits":true,      
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
    buildWordCloud(dict, container) {
  
      Object.keys(dict).forEach(function(key) {
  
        container.innerHTML += '<h4 id = "wordCloudContent">' 
          + '<span id="keyword">' + dict[key]['text'] + '</span>' 
          + '  ' + '<span id="numberOfKeywords">' 
          + dict[key]["count"] + '  ' + '</span>' + '</h4>' ;    
      });
  
    }
  
    clearWordCloud(container, header) {
      console.log('we inside clearWord Cloud')
      console.log(header)
      container.innerHTML = header;
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
  var sentimentRating = document.getElementById("sentimentRating");
  var sentimentCont = document.getElementById("sentimentCont");
  var entitiesCont = document.getElementById("entitiesCont");
  var keywordsCont = document.getElementById("keywordsCont");
  var reviewsCont = document.getElementById("reviewsCont");
  var relatedConceptsCont = document.getElementById("relatedConceptsCont");
  var productName = document.getElementById("productName");
  var productHeader = document.getElementById("productHeader");
  var topKeywords = document.getElementById("topKeywords");
  var topEntities = document.getElementById("topEntities");
  var relatedConcepts = document.getElementById("relatedConcepts");
  
  
  var results;
  var posCount = 0;
  var neuCount = 0;
  var negCount = 0;
  var sentimentWeightedScoreSum = 0;
  var nullRatingsCounter = 0;
  var entitiesDict = [];
  var keywordDict = [];
  var conceptDict = [];
  var data = {};
  var showKeywords = true;
  var showConcepts = true;
  var showEntities = true;
  
  outputText.hidden = true;
  loader.hidden = true; //hide loader at the start of the app
  sentimentRating.hidden = true;
  sentimentCont.hidden = true;
  entitiesCont.hidden = true;
  keywordsCont.hidden = true;
  relatedConceptsCont.hidden = true;
  reviewsCont.hidden = true;
  productName.hidden = true;
  productHeader.hidden = true;
  