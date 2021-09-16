const express = require('express');
const verifyToken = require('../../../middlewares/verifyToken');
const updateLoginAt = require('../../../middlewares/updateLoginAt');
const mysql = require('mysql');
const util = require('util');
const mysqlConnection = require('../../../middlewares/mysqlConnection');

const router = express.Router();

/* GET users listing. */
/* ユーザー情報取得 */
router.get('/', verifyToken, updateLoginAt, function (req, res, next) {
  const sql = () => {
    let sql = 'SELECT * FROM ?? '
    if (Object.keys(req.query).length !== 0) {
      sql += 'WHERE '
      if (req.query.user_id) {
        sql += '?? = ? && '
      } if (req.query.state) {
        sql += '?? = ? && '
      } if (req.query.sort) {
        sql += '?? = ?'
      }

      if (sql.slice(-4) === ' && ') {
        sql = sql.slice(0, -4);
      }
    }

    return sql;
  }

  const table = () => {
    let table = ['users']
    // 指定ユーザーの情報取得
    if (req.query.user_id) {
      table.push('user_id', req.query.user_id)
    } if (req.query.state) {
      table.push('state', req.query.state)
    } if (req.query.sort) {
      table.push('sort', req.query.sort)
    }

    return table
  }

  if (req.query.sort === 'rank') {
    const query = util.promisify(mysqlConnection.query).bind(mysqlConnection);
    (async () => {
      const sql = 'SELECT id, user_id, name, icon, match_record_win, match_record_lose, FIND_IN_SET(match_record_win-match_record_lose, (SELECT GROUP_CONCAT(match_record_win-match_record_lose ORDER BY match_record_win-match_record_lose DESC) FROM users)) AS rank FROM users ORDER BY `rank` ASC';
      const rows = await query(sql);

      for (let row of rows) {
        let update = `UPDATE users SET rank=? WHERE ??=?`;
        let table = [row.rank, 'user_id', row.user_id];
        mysqlConnection.query(mysql.format(update, table), function (err) {
          if (err) {
            res.status(403).json({ message: err });
            return;
          }
        });
      }
      res.status(200).json({ message: 'Success', data: rows });
    })()
    return;
  }

  const query = mysql.format(sql(), table());
  console.log(query);
  res.header('Content-Type', 'application/json; charset=utf-8')
  mysqlConnection.query(query, function (err, rows) {
    if (err) {
      res.status(403).json({ message: err });
      return;
    } else {
      if (rows.length === 0) {
        res.status(202).json({ message: 'User Not Found' });
        return;
      } else {
        res.status(200).json({ message: 'Success', data: rows });
      }
    }
  });
  return;
});

/* POST users listing */
/* ユーザーの新規登録 */
router.post('/', verifyToken, function (req, res, next) {
  // 新規ユーザー追加
  let sql = 'INSERT INTO users (user_id, name, icon) VALUE(?, ?, ?)';
  let table = [newUserData.userId, newUserData.name, newUserData.icon];
  let query = mysql.format(sql, table);
  res.header('Content-Type', 'application/json; charset=utf-8')
  mysqlConnection.query(query, function (err) {
    if (err) {
      res.status(403).json({ message: err });
    }
  });
  sql = 'UPDATE users SET login_at=NOW() WHERE ??=?';
  table = ['user_id', newUserData.userId];
  query = mysql.format(sql, table);
  mysqlConnection.query(query, function (err, rows) {
    if (err) {
      res.status(403).send({
        message: '日付の更新に失敗しました。',
      });
      return;
    } else {
      res.status(200).json({ message: 'Success', data: newUserData });
    }
  });
  return;
});

module.exports = router;
