const express = require('express');
const dayjs = require('dayjs')
const verifyToken = require('../../../middlewares/verifyToken');
const mysql = require('mysql');
const mysqlConnection = require('../../../middlewares/mysqlConnection');

const router = express.Router();
dayjs.locale('ja');

/* GET */
/* 室温・湿度の一覧取得 */
router.get('/', verifyToken, (req, res, next) => {
  const sql = (() => {
    let sql = 'SELECT * FROM ?? ';
    if (req.query.datetime_stamp_start && req.query.datetime_stamp_end) {
      sql += 'WHERE ?? BETWEEN ? AND  ?'
    }
    return sql;
  })();

  const table = (() => {
    const table = ['th']
    // 指定プレイヤーの情報取得
    if (req.query.datetime_stamp_start && req.query.datetime_stamp_end) {
      const datetimeStampStart = dayjs(req.query.datetime_stamp_start).format('YYYY-MM-DD HH:mm:ss')
      const datetimeStampEnd = dayjs(req.query.datetime_stamp_end).format('YYYY-MM-DD HH:mm:ss')
      table.push('datetime_stamp', datetimeStampStart, datetimeStampEnd)
    }
    return table
  })();

  const query = mysql.format(sql, table);
  mysqlConnection.query(query, (err, rows) => {
    res.header('Content-Type', 'application/json; charset=utf-8')
    if (err) {
      res.status(403).json({ message: err });
    } else {
      if (rows.length === 0) {
        res.status(202).json({ message: 'Data Not Found' });
      } else {
        res.status(200).json({ message: 'Success', data: rows });
      }
    }
  });
  return;
});

/* POST */
/* 室温・湿度の新規登録 */
router.post('/', verifyToken, (req, res, next) => {
  if (!req.body.datetimeStamp && !req.body.temp && !req.body.hum) {
    res.status(403).json({ message: 'Error' });
    return;
  }
  const sql = 'INSERT INTO th (datetime_stamp, temp, hum) VALUE(?, ?, ?)';
  const table = [dayjs(req.body.datetimeStamp).format('YYYY-MM-DD HH-mm-ss'), req.body.temp, req.body.hum];
  const query = mysql.format(sql, table);

  mysqlConnection.query(query, (err) => {
    res.header('Content-Type', 'application/json; charset=utf-8')
    if (err) {
      res.status(403).json({ message: err });
    } else {
      res.status(200).json({ message: 'Success' });
    }
  });
  return;
});

module.exports = router;
