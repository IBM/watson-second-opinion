//reg ex to recognize amazon product ID from URL
var pattern = /(B[0-9]{2}[0-9A-Z]{7}|[0-9]{9}(?:X|[0-9]))/;

//query DOM
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

//variables to show NLU results
var entitiesDict = [];
var keywordDict = [];
var conceptDict = [];
var data = {};
var showKeywords = true;
var showConcepts = true;
var showEntities = true;
var watsonStarRating;

//hide everything at start of app
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

function analyze() {
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

  console.log('clearing results from previous query');

  keywordDict = [];
  entitiesDict = [];
  conceptDict = [];

  //clear the keywords from the previous query
  keywordsCont.innerHTML = '<center> <h2 id="topKeywords">Top Keywords</h2>'
    + '<h3 id="keywordDescription">Most common keywords extracted from customer reviews sorted by relavance (0-1).</h3> </center>';

  entitiesCont.innerHTML = '<center> <h2 id="topEntities">Top Entities</h2>'
    + '<h3 id="entityDescription">Most common people, companies, organization, and cities extracted from custmer reviews sorted by relavance (0-1).</h3> </center>';

  relatedConceptsCont.innerHTML = '<center> <h2 id="relatedConcepts">Related Concepts</h2>'
    + '<h3 id="conceptsDescription">General concepts that are not necessarily referenced in your data sorted by relavance (0-1).</h3></center>';

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

      productHeader.innerHTML = '<b>' + 'Showing results for: </b>';

      productName.innerHTML = '"<i>' + output.reviews.productName + '</i>"';

      //build the stars based on the reviews from the customers

      getStarRatings(output.reviews.reviews);

      getInsights(output);

      watsonStarRating = output.sentiment.document.score;

      var sentimentPercent = 50 + (watsonStarRating * 50);

      console.log('sentimentPercent: ')
      console.log(sentimentPercent.toFixed(0));

      // var x = document.getElementsByClassName("bar");
      // x.dataset.percent = sentimentPercent.toFixed(0);
      (function(document) {
        var _bars = [].slice.call(document.querySelectorAll('.bar-inner'));
        _bars.map(function(bar, index) {
          setTimeout(function() {
            bar.dataset.percent = sentimentPercent.toFixed(0)+ "%";
            bar.style.width = bar.dataset.percent;
          }, 0);
          
        });

      })(document)

      


      //adjust sentiment rating to a 5 point scale. 
      if (watsonStarRating > 0) {
        watsonStarRating = (Math.sqrt(watsonStarRating) * 2) + 3;
      } else if (watsonStarRating < 0) {
        (-1*Math.sqrt(Math.abs(watsonStarRating)) * 2) + 3;
      } else {
        watsonStarRating = 0;
      }

      var amazonScrapeRating = output.reviews.starRating.substring(0, 3);

      sentimentRating.innerHTML = '<h2> <span id = "amazonRating">Amazon Rating: '
        + '<span style="font-weight: bold; ">' + amazonScrapeRating + '</span>'
        + ' stars' + '</span>' + ' <br>'
        + '<span id = "sentimentRating">'
        + '<a href="https://www.ibm.com/watson/developer/"> Watson </a>' + ' Rating: '
        + '<span style="font-weight: bold; ">'
        + watsonStarRating.toString().substring(0, 3) + '</span>'
        + ' stars</span></h2>';

      //determine if we show keywords or not
      if (showKeywords) {
        topKeywords.hidden = false;
        keywordsCont.hidden = false;
        var keywordId = 'keywordsCont';
        buildWordCloud(keywordDict, keywordsCont);
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
        buildWordCloud(conceptDict, relatedConceptsCont);
      } else {
        relatedConcepts.hidden = true;
        relatedConceptsCont.hidden = true;
      }

      if (showEntities) {
        topEntities.hidden = false;
        entitiesCont.hidden = false;
        var entitiesId = 'entitiesCont';
        buildWordCloud(entitiesDict, entitiesCont);
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
  };
  ourRequest.send(json);
}

document.getElementById("goButton").addEventListener("click", function(){
  analyze();
});
