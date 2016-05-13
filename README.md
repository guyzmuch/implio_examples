# implio_examples 


In this repository, you will find couple of example to quickly communicate with Implio.

Just do the usual 
npm install

You have 3 folders

1. mysql_example

  This example will connect to a mysql database (that needs to get created), then :
   - will send ads every xx:00, and xx:30 (xx are minutes)
   - will retrieve ads every xx:15, and xx:45 (xx are minutes)
  It pick ads to send to implio from the database, and update this database with implio decision

  /!\ this is a simple application that don't deal with errors (we expect everything to work fine)


 a) open mysql_example/index.js file in your favorite IDE, and fill the info about
  - your implio api key
  - your database information
 b) clean any test database you could have
 mysql -u <username> -p -e "DROP DATABASE implio_test;"
 c) create the test database
 mysql -u <username> -p -e "CREATE DATABASE implio_test;"
 d) insert the mysql dump (from the root of the project)
 mysql -u <username> -p implio_test < mysql_example/implio_test__dump.sql
 e) (optional) check that your data are 'raw'
 mysql -u <username> -p -e "SELECT * FROM implio_test.my_ads;"
 f) run the script
 node mysql_example/index.js
 g) (optional) check that your data changed
 mysql -u <username> -p -e "SELECT * FROM implio_test.my_ads;"


 i) (optional) insert additional data to the database
 mysql -u <username> -p implio_test < mysql_example/implio_test__insert_more.sql


2. SQLite_fake_site

  This example will create a SQLite database, then :
   - will send ads every xx:00, and xx:30 (xx are minutes)
   - will retrieve ads every xx:15, and xx:45 (xx are minutes)
   - will create new ads at random time (betweeen 3 and 0.5 seconds)
  It pick ads to send to implio from the database, and update this database with implio decision.
  You can also check some statistic from on page

  /!\ this is a simple application that don't deal with errors (we expect everything to work fine)


 a) open SQLite_fake_site/index.js file in your favorite IDE, and fill the info about
  - your implio api key
 b) run the script
 node SQLite_fake_site/index.js
 c) go to the path to see statistic on what is happening (number got reseted every time you reload the application)
 http://localhost:8000/

3. implio_webhooks

