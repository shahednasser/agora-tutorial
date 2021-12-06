const express = require('express')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const LocalStrategy = require('passport-local').Strategy
const cookieParser = require('cookie-parser')
const session = require('express-session')
const flash = require('connect-flash')
const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.use(express.static('public/assets'))

app.use(cookieParser('super secret'));
app.use(session({ 
  secret: 'super secret'
}))
app.use(flash());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

passport.use(new LocalStrategy(
  {
     usernameField: 'email',
     passwordField: 'password'
  },
  function(username, password, done) {
    const db = new sqlite3.Database('db.sql')
    db.get('SELECT * FROM users WHERE email = ?', [username], (err, row) => {
      if (err) {
        return done(err)
      }

      if (!row) {
        return done(null, false, { message: 'User does not exist' })
      }

      //check password
      if (!bcrypt.compareSync(password, row.password)) {
        return done(null, false, { message: 'Incorrect password' })
      }

      return done(null, row)
    })
    
  }
))

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  const db = new sqlite3.Database('db.sql')
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    done(err, row)
  })
})

function isLoggedIn(req, res, done) {
  if (req.user) {
     return done()
  }
  
  return res.redirect('/login');
}

function isGuest (req, res, done) {
  if (req.user) {
    return res.redirect('/')
  }

  return done()
}

app.use(passport.initialize())
app.use(passport.session())

//create database tables
const db = new sqlite3.Database('db.sql')
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL)')
  db.run('CREATE TABLE IF NOT EXISTS user_audios (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, user_id INTEGER, filename VARCHAR(255) NOT NULL)')

  //create user if it doesn't exist
  db.get('SELECT * FROM users WHERE email = ?', ['user@example.com'], function (err, row) {
    if (err) {
      throw err
    }

    if (!row) {
      db.run('INSERT INTO users(email, password) VALUES (?, ?)', ['user@example.com', bcrypt.hashSync('123123123', bcrypt.genSaltSync(10), null)])
    }

    db.close()
  })
})

app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash : true }), (req, res) => {
  res.redirect('/');
})

app.get('/', isLoggedIn, (req, res) => {
  return res.render('index')
})

app.get('/login', isGuest, (req, res) => {
  const obj = { error: ''}
  const error = req.flash('error')
  if (error.length) {
    obj.error = error[0]
  }
  return res.render('login', obj)
})

app.listen(port, () => {
  console.log(`Agora.io app listening at http://localhost:${port}`)
})