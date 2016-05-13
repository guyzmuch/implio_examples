'use strict';

// Required native nodejs
var http = require("https");
var fs = require("fs");

// Required node modules
var CronJob = require('cron').CronJob;
var sqlite3 = require('sqlite3').verbose();

// Require necessary file
var fake_data = require('./fake_data.js');

/*
  TODO Enter info related to your own implio application
 */
var implio_api_key = "<MY IMPLIO KEY>";


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

var statistic = {
  "number_created" : 0,
  "number_send" : 0,
  "number_received" : 0
};

/*
 WE CREATE THE DATABASE IF IT DON'T EXIST
 */
var file = "SQLite_fake_site/databases/implio_test.db";
var exists = fs.existsSync(file);

if(!exists) {
  fs.openSync(file, "w");
}

/*
  WE OPEN THE DATABASE, AND ONLY START WHEN IT IS OPEN
 */
var db = new sqlite3.Database(file);

/*
 WE CREATE THE TABLE IF IT DOESN'T EXITS
 */
db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS `my_ads` (" +
    "`id` INTEGER PRIMARY KEY, " +
    "`insertion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
    "`title` varchar(250) NOT NULL, " +
    "`body` text NOT NULL, " +
    "`location` varchar(250) NOT NULL, " +
    "`user_name` varchar(250) NOT NULL, " +
    "`implio_treated` int(11) NOT NULL DEFAULT '0', " +
    "`time_retrieved` datetime DEFAULT NULL, " +
    "`decision` varchar(200) DEFAULT NULL" +
    ");",
    function () {
      /*
       END OF THE CREATION OF THE TABLE
       */

      /**
       * This cron job run at every 00 seconds of every minutes to send ads to implio, we are :
       * - getting the ads from our own database
       * - reformating our result to the implio format
       * - sending the request to implio
       */
      var send_data_to_implio = new CronJob('00 * * * * *', function () {
        console.log("send_data_to_implio cron job started");

        db.all('SELECT * FROM my_ads WHERE implio_treated = 0;;',
          function (err, rows) {
            if (err) {
              console.log('An error have been encountered with the query. error message: ' + err);
            }
            else {
              console.log("just got the ads from my database");
              var implio_request = [];
              //Here we are going to map our data format, to the data format of implio
              for (var i = 0, iLen = rows.length; i < iLen; i++) {
                var implio_formated = {
                  "id": rows[i].id.toString() || "1",
                  "content": {
                    "title": rows[i].title,
                    "body": rows[i].body
                  }
                };

                implio_request.push(implio_formated);
                statistic.number_send = statistic.number_send + rows.length;

              }

              //then we do the request (we don't care to much right now if it works or not)
              var req = http.request(send_options, function (res) {
                var chunks = [];

                res.on("data", function (chunk) {
                  chunks.push(chunk);
                });

                res.on("end", function () {
                  console.log("implio respond to our post of ads");
                });
              });

              console.log("sending data to implio");
              req.write(JSON.stringify(implio_request));
              req.end();

            }
          }
        );
      }, null, true);

      /**
       * This cron job run at every 30 seconds of every minutes to get ads from implio, we are :
       * - doing a request to implio to get treated ads
       * - looping through the result, and updating our database with them
       */
      var get_data_to_implio = new CronJob('30 * * * * *', function () {
        console.log("get_data_to_implio cron job started");

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

            //Once we got the result, we are going to update our database with the information received (for each ad)
            for (var i = 0, iLen = implio_result.ads.length; i < iLen; i++) {
              db.run('UPDATE my_ads SET time_retrieved=NOW(), implio_treated=1, decision=$implio_decision WHERE id=$ad_id;',
                {
                  "$implio_decision": implio_result.ads[i].result.outcome,
                  "$ad_id": implio_result.ads[i].ad.id
                },
                function (err, rows) {
                  console.log("Our database is updated.");
                }
              );
            }

            statistic.number_received = statistic.number_received + implio_result.ads.length;

          });
        });

        console.log("requesting data to implio");
        req.end();

      }, null, true);


      /**
       * this function will create new ads with random information
       */
      var create_ad = function () {
        console.log("Inserting ad in our database");
        db.run("INSERT INTO my_ads " +
          "(`title`, `body`, `location`, `user_name`) VALUES " +
          "($title, $text, $location, $user);",
          {
            "$title": get_random_value(fake_data.title),
            "$text": get_random_value(fake_data.description),
            "$location": get_random_value(fake_data.location),
            "$user": get_random_value(fake_data.user)
          }
        );
        statistic.number_created ++;
      };

      var get_random_value = function (array_data) {
        return array_data[ (Math.round((Math.random() * (array_data.length - 1))) ) ];
      };

      /**
       * Here we are calling the ads creation function at random time
       * (creating a new 'setTimeout' every time with a new random time)
       */
      (function loop() {
        var rand = Math.round(Math.random() * (3000 - 500)) + 500; // generate new time (between 3sec and 500ms)
        setTimeout(function () {
          create_ad();
          loop();
        }, rand);
      }());

    });
});