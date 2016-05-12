# implio_examples 


In this repository, you will find couple of example to quickly communicate with Implio.

Just do the usual 
npm install

You have 3 folders

1. mysql_example
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
 npm node mysql_example/index.js
 g) (optional) check that your data changed
 mysql -u <username> -p -e "SELECT * FROM implio_test.my_ads;"


 i) (optional) insert additional data to the database
 mysql -u <username> -p implio_test < mysql_example/implio_test__insert_more.sql


2. SQLite_fake_site

3. implio_webhooks

