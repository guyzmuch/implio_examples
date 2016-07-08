'use strict';

// Required native nodejs
var http = require("http");
var https = require("https");
var fs = require("fs");
var qs = require('querystring');

// Required node modules
var CronJob = require('cron').CronJob;
var sqlite3 = require('sqlite3').verbose();

// Require necessary file
var fake_data = require('./fake_data.js');

/*
  TODO Enter info related to your own implio application
 */
var implio_api_key = "<MY IMPLIO KEY>";
var webhook_port = "<MY ACCESS PORT>";


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

var statistic = {
  "number_created" : 0,
  "number_send" : 0,
  "number_received" : 0
};

/*
 WE CREATE THE DATABASE IF IT DON'T EXIST
 */
var dir = './implio_webhooks/databases';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

var file = "implio_webhooks/databases/implio_test.db";
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
    "`send_to_implio` int(11) NOT NULL DEFAULT '0', " +
    "`implio_treated` int(11) NOT NULL DEFAULT '0', " +
    "`time_retrieved` datetime DEFAULT NULL, " +
    "`decision` varchar(200) DEFAULT NULL" +
    ");",
    function () {
      /*
       END OF THE CREATION OF THE TABLE
       */

      /**
       * This cron job run at every 00 and 30 seconds of every minutes to send ads to implio, we are :
       * - getting the ads from our own database
       * - looping through each ads, to send then one by one, updating the database
       * - reformating our result to the implio format
       * - sending the request to implio
       */
      var send_data_to_implio = new CronJob('00,30 * * * * *', function () {
        console.log("send_data_to_implio cron job started");

        db.send_to_implio('SELECT * FROM my_ads WHERE send_to_implio = 0;',
          function (err, row) {
            if (err) {
              console.log('An error have been encountered with the query. error message: ' + err);
            }
            else {
              console.log("just got one ads from my database");

              //Here we are going to map our data format, to the data format of implio
              var implio_request = [{
                "id": row.id.toString() || "1",
                "content": {
                  "title": row.title,
                  "body": row.body
                }
              }];

              statistic.number_send = statistic.number_send++;

              //then we do the request (we don't care to much right now if it works or not)
              var req = https.request(send_options, function (res) {
                var chunks = [];

                res.on("data", function (chunk) {
                  chunks.push(chunk);
                });

                res.on("end", function () {
                  console.log("implio respond to our post of ads");
                });
              });

              //console.log("sending one ad to implio");
              req.write(JSON.stringify(implio_request));
              req.end();

              //Finally, we update the database, to tell that this ad have been send to implio
              db.run('UPDATE my_ads SET send_to_implio=1 WHERE id=$ad_id;',
                {
                  "$ad_id": row.id
                },
                function (err, rows) {
                  //console.log("Our ad is updated with 'send_to_implio'.");
                }
              );

            }
          }
        );
      }, null, true);

      /**
       * This function is called everytime implio call our webhooks, we are :
       * - doing a request to implio to get treated ads
       * - looping through the result, and updating our database with them
       */
      var get_data_from_implio = function (implio_response) {
        console.log("Got one ad back from implio");

        console.log("implio_response : "+implio_response)
        console.log("implio_response : "+JSON.stringify(implio_response));

        var implio_result = JSON.parse(implio_response);

        if(implio_result.ads && implio_result.ads.length){
          //Once we got the result, we are going to update our database with the information received (for each ad)
          for (var i = 0, iLen = implio_result.ads.length; i < iLen; i++) {
            db.run('UPDATE my_ads SET time_retrieved=date(\'now\'), implio_treated=1, decision=$implio_decision WHERE id=$ad_id;',
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
        }

      };


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
        var rand = Math.round(Math.random() * (10000 - 3000)) + 3000; // generate new time (between 10 and 3sec)
        setTimeout(function () {
          create_ad();
          loop();
        }, rand);
      }());

    });
});


/*
WE CREATE A SERVER JUST TO HAVE SOMEWHERE TO SEE THE STATISTIC
 */

var display_database_result = function(callback){
  db.all('SELECT * FROM my_ads ORDER BY id DESC LIMIT 20',
    function (err, rows) {
      if (err) {
        console.log('An error have been encountered with the query. error message: ' + err);
        return "<div><p>Error getting the data from the database.</p></div>"
      }
      else {
        var html ="<div><table><tbody>";
        //console.log("rows : "+rows);
        //console.log("rows : "+JSON.stringify(rows));
        for (var i = 0, iLen = rows.length; i < iLen; i++) {
          html += "<tr>";
          for (var colunmName in rows[i]) {
            html += "<td>"+rows[i][colunmName]+"</td>";
          }
          html += "</tr>";
        }


        html += "</tbody></table></div>";
        callback(html);
      }
    }
  );
};

//Server for statistic
http.createServer(function (req, res) {
  display_database_result(function(result){
    res.end(
`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Implio Statistic</title>
    <style>
      table {
        border-collapse: collapse;
      }

      table, th, td {
        border: 1px solid black;
      }
    </style>
  </head>

  <body>
    <h3>Implio Statistic</h3>
    <div>
      <p><strong>Number of ad created : </strong>` + statistic.number_created + `</p>
      <p><strong>Number of ad send : </strong>` + statistic.number_send + `</p>
      <p><strong>Number of ad received : </strong>` + statistic.number_received + `</p>
    </div>
    <div>`+
      result +
    `</div>
  </body>
</html>`
    );
  });

}).listen(8000);


//Server for imlio webhook
http.createServer(function (req, res) {
  if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });
        request.on('end', function () {
          console.log("got a request");
          //we call the function to treat the response
          //But then don't care if it fail or not, we say 'ok' to implio
          get_data_from_implio(qs.parse(body));
          res.end('OK');
        });
    }
    else{
      res.end('OK');
    }
}).listen(webhook_port);
