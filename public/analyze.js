// var ProgressBar = require('progressbar.js');

class Watson{
  discovery(){

    var posCount = 0;
    var neuCount = 0;
    var negCount = 0;
    var entityCount = 0;
    loader.hidden = false; 
    sentimentCont.hidden = true;
    entitiesCont.hidden = true;
    reviewsCont.hidden = true;   

    data.url = document.getElementById("productUrl").value; 
    var match = data.url.match(pattern);
    data.source = match[0];
    console.log('data.url: ');
    console.log(data.url);
    console.log('data.source: ');
    console.log(data.source);
    var nodeUrl = 'http://localhost:4000/reviews/' + data.source;
    
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
        console.log(output);
        var reviewLen = output.results.length;
        var dict = [];
        var dictLenght = dict.length;
        var insertToEntities = true;

        reviewsCont.innerHTML = '<center><h2>Customer reviews </h2></center>';

        for (var i = 0; i < reviewLen; i++) {
          if (output.results[i].enriched_text !== undefined) {
            var entitiesLen = output.results[i].enriched_text.entities.length;
            if (entitiesLen > 0) {
              console.log('go here; ')
              console.log(i)
              for (var j = 0; j < entitiesLen; j++) {
                var entity = output.results[i].enriched_text.entities[j].text;
                var count = output.results[i].enriched_text.entities[j].count;
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
            if (output.results[i].enriched_text.sentiment.document.label === 'positive') {
              posCount++;
            } else if (output.results[i].enriched_text.sentiment.document.label === 'negative') {
                negCount++;
            } else {
              neuCount++;
            }      
          }
          
        }
        watson.sort(dict);

        var userIcon = '<i id = "userIcon" class="fa fa-user-circle-o"></i>';
        
        for (var i = 0; i < output.results.length; i++) {
          reviewsCont.innerHTML += userIcon + '<p>' + output.results[i].reviewer + '</p>';

          reviewsCont.innerHTML += 
          '<div class="stars-outer">' +
          '<p id = "rating">' + 'Rating: ' + '</p>';
          var numberOfStars = 0;
          var starsContent = "";
          while (numberOfStars < output.results[i].rating) {
            starsContent += "&#xf005 ";
            numberOfStars++;
          }
          while (numberOfStars < 5) {
            starsContent += "&#xf006 ";
            numberOfStars++;
          }
          reviewsCont.innerHTML += '<div class="stars-inner fa">' + starsContent + '</div></div>';
          

          reviewsCont.innerHTML += '<p id = "reviewText">' + '<p><b>' +
            output.results[i].title + ' - ' + ' </b>' + output.results[i].text + '<br></p>';   
        }

        var posPercent = Math.round(100*(posCount / reviewLen));
        var negPercent = Math.round(100*(negCount / reviewLen));
        var neuPercent = Math.round(100*(neuCount / reviewLen));

        var generalSent = posPercent - negPercent;
        var overallSentiment = '';

        console.log('posPercent: ')
        console.log(posPercent)

        var overallSentiment = 'General<br>Sentiment: <br>' +
          posPercent + '% Positive'; 

        Highcharts.setOptions({
          colors: ['#64E572', '#ffff00','#ff0000']
        });

        var graph = Highcharts.chart('sentimentCont', {
          chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 0,
            plotShadow: false
          },
          title: {
            text: overallSentiment,
            align: 'center',
            verticalAlign: 'middle',
            y: 40
          },
          tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:1.0f}%</b>'
          },
          plotOptions: {
            pie: {
              dataLabels: {
                enabled: true,
                distance: -50,
                style: {
                  fontWeight: 'bold',
                  color: 'white'
                }
              },
              startAngle: -90,
              endAngle: 90,
              center: ['50%', '75%']
            }
          },
          series: [{
            type: 'pie',
            name: 'General Product Sentiment',
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

          var myConfig = {
            type: 'wordcloud',
            options: {
              "words": dict,
              minLength: 4
            }
          };
           
          var something = zingchart.render({ 
            id: 'entitiesCont', 
            data: myConfig, 
            height: 400, 
            width: '100%' 
          });         
      }
      // outputText.hidden = false;
      loader.hidden = true;
      sentimentCont.hidden = false;  
      entitiesCont.hidden = false;
      reviewsCont.hidden = false;              
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
var sentimentCont = document.getElementById("sentimentCont");
var entitiesCont = document.getElementById("entitiesCont");
var reviewsCont = document.getElementById("reviewsCont");


var data = {};

loader.hidden = true; //hide loader at the start of the app
sentimentCont.hidden = true;
entitiesCont.hidden = true;
reviewsCont.hidden = true; 


