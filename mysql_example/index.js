'use strict';

// Required native nodejs
var http = require("https");

// Required node modules
var CronJob = require('cron').CronJob;
var Client = require('mariasql');

/*
  TODO Enter info related to your own implio application
 */
var implio_api_key = "<MY IMPLIO KEY>";
var mysql_config = {
  "host": "<YOUR HOST>",
  "user": "<YOUR USER FOR MYSQL>",
  "password": "<YOUR PASSWORD FOR MYSQL>",
  "db": "implio_test"
};


// option needed to send ads to implio
var send_options = {
  "method": "POST",
  "hostname": "api.implio.com",
  "path": "/v1/ads",
  "headers": {
    "content-type": "application/json",
    "x-api-key": implio_api_key
  }
};

var get_options = {
  "method": "GET",
  "hostname": "api.implio.com",
  "path": "/v1/ads?timestamp=",
  "headers": {
    "x-api-key": implio_api_key
  }
};

/**
 * This cron job run at every 00 and 30 seconds of every minutes to send ads to implio, we are :
 * - getting the ads from our own database
 * - reformating our result to the implio format
 * - sending the request to implio
 */
var send_data_to_implio = new CronJob('00,30 * * * * *', function(){
  console.log("send_data_to_implio cron job started");
  var c = new Client();
  c.connect(mysql_config);

  //Getting the data from my database
  c.query('SELECT * FROM my_ads WHERE implio_treated = 0;',
    function(err, rows) {
      if (err){
        console.log('An error have been encountered with the query. error message: ' + err);
      }
      else{
        console.log("just got the ads from my database");
        var implio_request = [];
        //Here we are going to map our data format, to the data format of implio
        for (var i = 0, iLen = rows.length; i < iLen; i ++){
          var implio_formated = {
            "id": rows[i].id.toString() || "1",
            "content": {
              "title": rows[i].title,
              "body": rows[i].body
            }
          };

          implio_request.push(implio_formated);

        }

        //then we do the request (we don't care to much right now if it works or not)
        var req = http.request(send_options, function (res) {
          console.log("implio respond to our post of ads");
        });

        console.log("sending data to implio");
        req.write(JSON.stringify(implio_request));
        req.end();

      }
    }
  );
  c.end();
}, null, true);

/**
 * This cron job run at every 15 and 45 seconds of every minutes to get ads from implio, we are :
 * - doing a request to implio to get treated ads
 * - looping through the result, and updating our database with them
 */
var get_data_from_implio = new CronJob('15,45 * * * * *', function(){
  console.log("get_data_from_implio cron job started");
  //we calculate the timestamp to send to implio (for this example, it is just now minus 1 minutes)
  var request_timestamp = (new Date().getTime() - 1000 * 60);
  get_options.path = "/v1/ads?timestamp=" + request_timestamp;

  //Then we do the request
  var req = http.request(get_options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      console.log("implio finished to send us his response");
      var body = Buffer.concat(chunks);
      var implio_result = JSON.parse(body);

      var c = new Client();
      c.connect(mysql_config);

      //Once we got the result, we are going to update our database with the information received (for each ad)
      for (var i = 0, iLen = implio_result.ads.length; i < iLen; i ++) {
        var prep = c.prepare('UPDATE my_ads SET time_retrieved=NOW(), implio_treated=1, decision=:implio_decision WHERE id=:ad_id;');
        c.query(prep({
            "implio_decision": implio_result.ads[i].result.outcome,
            "ad_id": implio_result.ads[i].ad.id
          }),
          function (err, rows) {
            console.log("Our database is updated.");
          }
        );
      }

      c.end();

    });
  });

  console.log("requesting data to implio");
  req.end();

}, null, true);
