const bodyParser = require("body-parser");
const { application } = require("express");
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const port = process.env.PORT || 3001;

const pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* GET TASK FROM SEARCH TEXT */
async function getTaskFromText(searchText) {
  const myPromise = new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) throw err; //not connected

      const sqlSelect = `SELECT task FROM tbl_todos WHERE task = "${searchText}" `;
      connection.query(sqlSelect, (err, rows) => {
        connection.release();
        if (!err) {
          if (rows.length > 0) {
            /* return true if task exists */
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          console.log(err);
        }
      });
    });
  });
  return myPromise;
}

/* ADD A NEW TASK */
app.post("/addtask", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err; //not connected
    const { task } = req.body;
    /* If task does not exist, add to DB */
    const taskExist = getTaskFromText(task);
    console.log(taskExist);
    taskExist.then((result) => {
      if (!result) {
        const sqlInsert = `INSERT INTO tbl_todos (task, status) VALUES (?);`;
        let values = [task, "ACTIVE"];
        connection.query(sqlInsert, [values], (err, rows) => {
          connection.release();
          if (!err) {
            if (rows.affectedRows > 0) {
              res.json({
                status: true,
                message: "Task added successfully !",
                taskId: rows.insertId,
              });
            } else {
              res.json({ status: false, message: "Couldn't add task" });
            }
          } else {
            res.json({ status: false, message: err });
          }
        });
      } else {
        res.json({ status: false, message: "Existing task!" });
      }
    });
  });
});

/* GET ALL TASKS */
app.get("/gettasks", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err; //not connected

    const sqlSelect = "SELECT * FROM tbl_todos;";
    connection.query(sqlSelect, (err, rows) => {
      connection.release();
      if (!err) {
        if (rows.length > 0) {
          res.json({ taskCount: rows.length, availableTasks: rows });
        } else {
          res.json({ taskCount: rows.length, message: "No tasks added !" });
        }
      } else {
        res.json({ status: false, message: "Error !" });
      }
    });
  });
});

/* GET ALL TASKS FROM SEARCH TEXT */
app.post("/searchtask", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err; //not connected

    const { searchText } = req.body;
    const sqlSelect = `SELECT * FROM tbl_todos WHERE task LIKE '%${searchText}%';`;
    connection.query(sqlSelect, (err, rows) => {
      connection.release();
      if (!err) {
        if (rows.length > 0) {
          res.json({ taskCount: rows.length, availableTasks: rows });
        } else {
          res.json({ taskCount: rows.length, message: "No tasks found !" });
        }
      } else {
        res.json({ status: false, message: err });
      }
    });
  });
});

/* GET ACTIVE TASK COUNT */
app.get("/activeTaskCount", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const sqlSelect = `SELECT task FROM tbl_todos WHERE status = "ACTIVE" ;`;
    connection.query(sqlSelect, (err, rows) => {
      connection.release();
      if (!err) {
        res.json({ activeTaskCount: rows.length });
      } else {
        res.json({ message: err });
      }
    });
  });
});

/* DELETE TASK */
app.post("/deleteTask", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const { taskId } = req.body;

    const sqlSelect = `DELETE FROM tbl_todos WHERE id = ${taskId};`;
    connection.query(sqlSelect, (err, rows) => {
      connection.release();
      if (!err) {
        if (rows.affectedRows == 1) {
          res.json({ status: true, message: "Task deleted successfully !" });
        } else {
          res.json({ status: false, message: "Couldn't delete task !" });
        }
      } else {
        res.json({ status: false, message: err });
      }
    });
  });
});

/* GET TASK FROM ID */
function getTaskFromId(task_id) {
  pool.getConnection((err, connection) => {
    if (err) throw err; //not connected

    const sqlSelect = `SELECT * FROM tbl_todos WHERE id=${task_id};`;
    connection.query(sqlSelect, (err, rows) => {
      connection.release();
      if (!err) {
        if (rows.length > 0) {
          console.log(rows);
          return rows;
        } else {
          return null;
        }
      } else {
        return null;
      }
    });
  });
}

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
