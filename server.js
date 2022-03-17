var express = require("express")
var app = express()
var db = require("./database.js")
var bodyParser = require('body-parser')
var HTTP_PORT = 8000
require("dotenv").config();
var jsonParser = bodyParser.json()
var md5 = require("md5")
var urlencodedParser = bodyParser.urlencoded({ extended: false })
const cors = require('cors');
var jwt = require('jsonwebtoken');
app.use(cors({ origin: '*' }))
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT))
});

app.get("/", (req, res, next) => {
    res.json({ "message": "Ok" })
});

app.get("/api/users", (req, res, next) => {
    var sql = "select * from user"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

app.post("/api/user/", jsonParser, (req, res, next) => {
    if (!req.body.email || !req.body.password || !req.body.nombre) {
        res.status(400).json({
            "The next params have not been specified: ": (!req.body.email && " email ")
                + (!req.body.password && " password ") + (!req.body.nombre && " nombre ")
        });
        return;
    }
    if (!validateEmail(req.body.email) || !validatePass(req.body.password)) {
        res.status(400).json({
            "The next params have not been specified correctly: ": (!validateEmail(req.body.email) && " email ")
                + (!validatePass(req.body.password) && " password ") + (!req.body.nombre && " nombre ")
        });
        return;
    }
    var sql = 'insert into user (nombre, email, password) VALUES (?,?,?)'
    var params = [req.body.nombre, req.body.email, md5(req.body.password)]
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }
        res.json({
            "message": "success",
            "id": this.lastID
        })
    });
})
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};
const validatePass = (password1) => {
    return /[a-z]/.test(password1)
        && /[A-Z]/.test(password1)
        && /[0-9]/.test(password1)
        && /[!@#$%^&*_-~.,;:+=]/.test(password1)
        && String(password1).length >= 8
};
app.post("/api/login/", jsonParser, (req, res, next) => {
    if (!req.body.email || !req.body.password) {
        res.status(400).json({
            "The next params have not been specified: ": (!req.body.email && " email ")
                + (!req.body.password && " password ")
        });
        return;
    }
    if (!validateEmail(req.body.email) || !validatePass(req.body.password)) {
        res.status(400).json({
            "The next params have not been specified correctly: ": (!validateEmail(req.body.email) && " email ")
                + (!validatePass(req.body.password) && " password ")
        });
        return;
    }
    var data = {
        email: req.body.email,
        password: md5(req.body.password)
    }
    var sql = 'select * from user where email = ? and password = ?'
    var params = [data.email, data.password]
    db.get(sql, params, (err, result) => {
        if (err || !result) {
            res.status(400).json({ "error": err ? err.message : (!result ? "incorrect user or password" : "unknown error") })
            return;
        }
        const token = jwt.sign(
            { user_id: result.id, nombre: result.nombre, email: result.email },
            process.env.TOKEN_KEY,
            {}
        );
        res.json({
            "message": "success",
            "data": token,
        })
    });
})

app.use(function (req, res) {
    res.status(404);
});