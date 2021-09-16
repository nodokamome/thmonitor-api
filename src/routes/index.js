const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.sendfile('./public/index.html');  //クライアントにindex.htmlを返す
});

module.exports = router;
