var express = require("express");
const shell = require('shelljs');
var bodyParser = require('body-parser');


var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/:id', function(req, res) {
  console.log(req.params.id);
  res.render('index', { body: '{"T1": [{"Hello": "greeting", "Goodbye": "Salutations"}]}' });
});

app.post('/:id', function (req, res) {
  console.log('runnnnnnn');
  const dataLoc = "go"
  shell.exec(`echo -e "${help}" > ./data/${dataLoc}.json`);
});

app.listen(3500, function(){});
