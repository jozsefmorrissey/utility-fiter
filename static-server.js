var express = require("express");
const shell = require('shelljs');
var bodyParser = require('body-parser');
const fs = require('fs');


var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

function saveHtml(path, data, id) {
  let template = fs.readFileSync('./views/index.html', 'utf-8');
  template = template.replace('<%= body %>', data);
  template = template.replace('<%= id %>', id);
  const htmlPath = `./public/html/${path}.html`;
  shell.mkdir('-p', htmlPath.replace(/(.*\/).*/, '$1'));
  fs.writeFileSync(htmlPath, template);
}

app.get('/:id', function(req, res) {
  const id = req.params.id;
  console.log(id);
  res.render('index', { id, body: '{"T1": [{"Hello": "greeting", "Goodbye": "Salutations"}]}' });
});

app.post('/:id', function (req, res) {
  const id = req.params.id;
  console.log(id);

  const path = id.replace(/\./g, "/");
  const dataLoc = `./data/${path}.json`;
  shell.mkdir('-p', dataLoc.replace(/(.*\/).*/, '$1'));
  const data = JSON.stringify(req.body, null, 2);
  fs.writeFileSync(dataLoc, data);
  saveHtml(path, data, id);
  res.send('success');
});

app.listen(3500, function(){});
