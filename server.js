var fs = require('fs');
var request = require('request');
var express = require('express');
var cheerio = require('cheerio');
var app = express();
var port = 3000;
app.listen(port,function(){
  console.log('app listening on port ' + port);
});

var ParseData = (function(){
  var concordance = {};
  var keys = [];

  var parse = function(data){
    words = data.split(/\W+/); //collect all the words
    for(var i = 0; i<words.length;i++){
      if(concordance[words[i]] === undefined){
        concordance[words[i]] = 1; //add word
        keys.push(words[i]);
      } else {
        concordance[words[i]]++; //increase occurance of word
      }
    }

    keys.sort(function(a,b){
      return (concordance[b] - concordance[a]);
    });

    for(var i = 0; i < keys.length; i++){
      console.log(keys[i] + ': ' + concordance[keys[i]]); //THIS IS THE IMPORTANT PART!
    }

  };

  return {
    readFromDisk: function(path){
      fs.readFile(path,'utf8', function(error, data){
        if(error){
          console.error(error);
        } else {
          parse(data);
        }
      });
    }
  };
})();


var WebParser = (function(){

  var readUrlRecursively = function(websiteBaseUrl,count,max,path,fileName,suffix){
      var new_count = ++count;
      console.log("Requesting -- " + websiteBaseUrl + new_count);
      request(websiteBaseUrl + new_count, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(body);
          var email = $('.email-content').text();
          console.log(email);
            fs.appendFile(path+fileName+suffix,email,function(err){
              if(error){
                console.error(error);
              }
              else if(new_count < max) {
                readUrlRecursively(websiteBaseUrl,count,max,path);
              } else if(new_count == max) {
                ParseData.readFromDisk(path);
              }
            });
        }
        else {
          console.error('request failed; exiting')
        }
      });
  };
  return {
    downloadMeetingLists : function(websiteBaseUrl, max, path,fileName,suffix){
      readUrlRecursively(websiteBaseUrl,0,10,path,FileName,suffix);
    }
  }
})();
var path = 'data/';
var fileName = 'dnc-email';
var suffix = '.txt';
WebParser.downloadMeetingLists("https://wikileaks.org/dnc-emails/emailid/",10,path,fileName,suffix);
