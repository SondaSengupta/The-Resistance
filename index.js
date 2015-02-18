var express = require('express'),
    app = express();

app.set('view engine', 'jade');
app.set('views', './views');


app.get('/', function(req, res){
  res.render('index');
});

var server = app.listen(8000, function(){
  console.log('WIZARD FIGHT ON PORT 8000');
})
