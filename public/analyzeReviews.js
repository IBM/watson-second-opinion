//reg ex to recognize amazon product ID from URL
var pattern = /(B[0-9]{2}[0-9A-Z]{7}|[0-9]{9}(?:X|[0-9]))/;
/* global showSentiment, getStarRatings, getNLUData, buildCharts*/

//query DOM
var outputText = document.getElementById('discoveryQueryOutput'); //variable that will hold our final translation
var loader = document.getElementById('myLoader');
var loaderInfo = document.getElementById('loaderInfo');
var sentimentRating = document.getElementById('sentimentRating');
var sentimentCont = document.getElementById('sentimentCont');
var entitiesCont = document.getElementById('entitiesCont');
var keywordsCont = document.getElementById('keywordsCont');
var reviewsCont = document.getElementById('reviewsCont');
var relatedConceptsCont = document.getElementById('relatedConceptsCont');
var productHeader = document.getElementById('productHeader');
var productPic = document.getElementById('productPic');
var productCont = document.getElementById('productCont');
var topKeywords = document.getElementById('topKeywords');
var topEntities = document.getElementById('topEntities');
var relatedConcepts = document.getElementById('relatedConcepts');
var button = document.getElementById('goButton');
var inputUrl = document.getElementById('productUrl');


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
loaderInfo.hidden = true; //hide loader at the start of the app
sentimentRating.hidden = true;
sentimentCont.hidden = true;
entitiesCont.hidden = true;
keywordsCont.hidden = true;
productCont.hidden = true;
relatedConceptsCont.hidden = true;
reviewsCont.hidden = true;
productHeader.hidden = true;

function analyze() {
  outputText.hidden = true;
  productHeader.hidden = true;
  data.url = document.getElementById('productUrl').value;
  var match = data.url.match(pattern);
  if (match == null) {
    outputText.hidden = false;
    sentimentRating.hidden = true;
    sentimentCont.hidden = true;
    entitiesCont.hidden = true;
    keywordsCont.hidden = true;
    relatedConceptsCont.hidden = true;
    reviewsCont.hidden = true;
    productCont.hidden = true;
    outputText.innerHTML = 'Please check your input is a valid Amazon product URL';
    return;
  }

  console.log('clearing results from previous query');

  //clear sentiment bar from previous query
  showSentiment(0);

  keywordDict = [];
  entitiesDict = [];
  conceptDict = [];

  //clear the keywords from the previous query
  keywordsCont.innerHTML = '<center> <h2 id="topKeywords">Top Keywords</h2>'
    + '<h3 id="keywordDescription">Most common keywords extracted from customer reviews sorted by relevance (0%-100%).</h3> </center>';

  entitiesCont.innerHTML = '<center> <h2 id="topEntities">Top Entities</h2>'
    + '<h3 id="entityDescription">Most common people, organizations, and' 
    + '<a href="https://console.bluemix.net/docs/services/natural-language-understanding/entity-types.html#entity-types-and-subtypes" target="_blank"> other information </a>'
    + 'extracted from customer reviews sorted by relevance (0%-100%).</h3> </center>';

  relatedConceptsCont.innerHTML = '<center> <h2 id="relatedConcepts">Related Concepts</h2>'
    + '<h3 id="conceptsDescription">General concepts that are not necessarily referenced in the reviews sorted by relevance (0%-100%).</h3></center>';

  loader.hidden = false;
  loaderInfo.hidden = false;  
  
  // wrapper.hidden = false;
  sentimentRating.hidden = true;
  sentimentCont.hidden = true;
  entitiesCont.hidden = true;
  reviewsCont.hidden = true;
  productCont.hidden = true;
  keywordsCont.hidden = true;
  relatedConceptsCont.hidden = true;
  console.log('data.source: ');
  console.log(match);
  data.source = match[0];
  var nodeUrl = window.location.href + 'reviews/' + data.source;
  console.log(nodeUrl);
  // var nodeUrl = 'https://2ndopinion.mybluemix.net/reviews/' + data.source;
  var json = JSON.stringify(data);
  var ourRequest = new XMLHttpRequest();
  ourRequest.open('GET', nodeUrl, true);
  ourRequest.setRequestHeader('Content-type', 'application/json');
  ourRequest.onload = function () {
    if (ourRequest.status == 400) {
      outputText.innerHTML = 'Error, check your network connection.';
    }
    else {

      var output = JSON.parse(ourRequest.responseText);
      console.log('output: ');
      console.log(output);

      productHeader.innerHTML = '<b>' + output.reviews.productName + '</b>';

      productPic.innerHTML = '<img id = "productPicId" src=' + output.reviews.img + '>';
      
      //build the stars based on the reviews from the customers

      getStarRatings(output.reviews.reviews);

      getNLUData(output);

      //show sentiment based on sentiment score from NLU analysis
      watsonStarRating = output.sentiment.document.score;
      var sentimentPercent = 50 + (watsonStarRating * 50);

      console.log('sentimentPer: ');
      console.log(sentimentPercent);

      showSentiment(sentimentPercent, '.bar-inner');

      //adjust sentiment rating to a 5 point scale. 
      if (watsonStarRating > 0) {
        watsonStarRating = (Math.sqrt(watsonStarRating) * 2) + 3;
      } else if (watsonStarRating < 0) {
        watsonStarRating = (-1 * Math.sqrt(Math.abs(watsonStarRating)) * 2) + 3;
      } else {
        watsonStarRating = 0;
      }

      var amazonScrapeRating = output.reviews.starRating.substring(0, 3);

      console.log('rating: ');
      console.log(amazonScrapeRating);

      sentimentRating.innerHTML = ' <span id = "amazonRating">Amazon Rating: '
        + '<span style="font-weight: bold; ">' + amazonScrapeRating + '</span>'
        + ' stars' + '</span>' + ' <br>'
        + '<span id = "watsonRating">'
        + '  Watson' + ' Rating: '
        + '<span style="font-weight: bold; cursor:pointer; ">'
        + watsonStarRating.toString().substring(0, 3) + '</span>'
        // + ' stars'  + 'f05a' ;
        + ' stars <div class="tooltip"> <i class="fas fa-info-circle"></i> <span class="tooltiptext"> '
        + 'The Watson Rating is computed by taking an aggregate of the product reviews and using natural language understanding '
        + 'to uncover insights from the reviews. The more positive the attitude and emotion of the review, the higher the Watson Rating.</span></div></span>';

      //determine if we show keywords or not
      if (showKeywords) {
        topKeywords.hidden = false;
        keywordsCont.hidden = false;
        var keywordBar = '.keywordBar-inner';
        buildCharts(keywordDict, keywordsCont, keywordBar);
      } else {
        topKeywords.hidden = true;
        keywordsCont.hidden = true;
      }
      console.log('concepts!');
      console.log(conceptDict);
      //determine if we show related concepts or not
      if (showConcepts) {
        relatedConcepts.hidden = false;
        relatedConceptsCont.hidden = false;
        buildCharts(conceptDict, relatedConceptsCont,'.conceptsBar-inner' );
      } else {
        relatedConcepts.hidden = true;
        relatedConceptsCont.hidden = true;
      }

      if (showEntities) {
        topEntities.hidden = false;
        entitiesCont.hidden = false;
        var entityBar = '.entityBar-inner';                
        buildCharts(entitiesDict, entitiesCont, entityBar);
      } else {
        entitiesCont.hidden = true;
        topEntities.hidden = true;
      }
    }
    loader.hidden = true;
    loaderInfo.hidden = true;    
    sentimentCont.hidden = false;
    reviewsCont.hidden = false;
    // productName.hidden = false;
    productHeader.hidden = false;
    sentimentRating.hidden = false;
    productCont.hidden = false;
  };
  ourRequest.send(json);
}

//Press the "Enter" key inside the input field to trigger the analysis
inputUrl.addEventListener('keyup', function(event) {
  event.preventDefault();
  if (event.keyCode === 13) {
    analyze();
  }
});

//click on magnifying glass icon to analyze
button.addEventListener('click', function () {
  analyze();
});

function navBarToggle() {
  var x = document.getElementById('myTopnav');
  if (x.className === 'topnav') {
    x.className += ' responsive';
  } else {
    x.className = 'topnav';
  }
}