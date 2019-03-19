const mysql = require('mysql')
const express = require('express')
const path = require('path')
const app = express()
const bodyParser = require('body-parser')
const port = 7007
const uuid = require('uuid/v4')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy


// set default templating engine to ejs
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(__dirname + "/public"))
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}));

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
    { usernameField: 'username' },
    (username, password, done) => {
        console.log('Inside local strategy callback')

        var connection = mysql.createConnection(
            {
                host : 'localhost',
                user : 'root',
                password : '12345678',
                database : 'OpenPool'
            }
        )
        var credentials = {
            username: username,
            password: password,
        }




        var check_query = 'select user_id, username from users where (username = ?) && (password= ?)'
        connection.query(check_query, [credentials.username, credentials.password], (err, results ) => {
            if(err) throw err
            connection.on('error', function() {})
            try {


                if(results) {
                    var user = {id :results[0].user_id, username: results[0].username }
                    return done(null, user)
                }
        }
        catch (err) {
                return done(null, false)
        }


    }
)}))

passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback. User id is save to the session file store here')
    done(null, user.id);
})

passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)

    var connection = mysql.createConnection(
        {
            host : 'localhost',
            user : 'root',
            password : '12345678',
            database : 'OpenPool'
        }
    )




    var check_query = 'select user_id, username from users where (user_id = ? )'
    connection.query(check_query, [id], (err, results ) => {
        connection.on('error', function() {})
        try {


            if (results) {
                var user = {id: results[0].user_id, username: results[0].username}
                return done(null, user)
            }
        } catch {

            return done(null, false)
        }

    })

});

app.use(session({
    genid: (req) => {
        console.log('Inside session middleware genid function')
        console.log(`Request object sessionID from client: ${req.sessionID}`)
        return uuid() // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());




app.get('/', (req,res) => {
    res.render('index')
})
app.get('/create', (req,res) => {
    var connection = mysql.createConnection(
        {
            host : 'localhost',
            user : 'root',
            password : '12345678',
            database : 'OpenPool'
        }
    )
    var occupied_usernames_query = 'select username from users;'
    connection.query(occupied_usernames_query, (error, results) => {
    try {
        if (error) throw error


        var occupied_usernames_and_emails_string_obj = JSON.stringify(results)
        res.render("create", {occupied_usernames_and_emails_string: occupied_usernames_and_emails_string_obj})
        connection.on('error', function() {})
        connection.end()
    }
    catch (error) {
        res.redirect('/')
    }
    })

    })
    app.post('/create/create_user', (req, res) => {

        var connection = mysql.createConnection(
            {
                host : 'localhost',
                user : 'root',
                password : '12345678',
                database : 'OpenPool'
            }
        )
        var new_user = {
            username: req.body.username,
            email:  req.body.email,
            password: req.body.password,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            sex: req.body.sex,
            contact_number: req.body.contact_number
        }
        var insert_query = 'insert into users set ?'
        try {
        connection.query(insert_query, new_user, function (err, results) {
                if(err) throw err
            res.redirect('/')
            connection.on('error', function() {})
    
        })}
        catch (err) {
            res.redirect('/create')
        }
        connection.end()
    })
    app.get('/login', (req,res) => {
        res.render('login')
    })
    app.post('/login', (req, res, next) => {

        passport.authenticate('local', (err, user, info) => {
            console.log('Inside passport.authenticate() callback');
            console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
            console.log(`req.user: ${JSON.stringify(req.user)}`)
            req.login(user, (err) => {
                console.log('Inside req.login() callback')
                console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
                console.log(`req.user: ${JSON.stringify(req.user)}`)
                return res.redirect("home")
            })
        })(req, res, next);
         })
    app.get('/home', (req,res) => {
        if(req.isAuthenticated()) {
            res.render('home')
        }
        else {
            res.redirect('/')
        }
    })
    app.get('/vehicle' , (req, res) => {
        if(req.isAuthenticated()) {
            res.render('vehicle')
        }
        else {
            res.redirect("/")
        }
    })
    app.post('/vehicle', (req, res) => {
        if(req.isAuthenticated()) {
            var connection = mysql.createConnection(
                {
                    host: 'localhost',
                    user: 'root',
                    password: '12345678',
                    database: 'OpenPool'
                }
            )
            var logged_in_user = req.session.passport.user
            var from = req.body.from
            var to = req.body.to
            var on = req.body.on

            var insert_trip_q = `insert into vehicle (t_from, t_to, t_on, user_id) values (?, ?, ?, ${logged_in_user})`
            connection.query(insert_trip_q, [from, to, on], (err, result) => {
                if(err) throw err;
                res.redirect('/home')
            })
        }
        else {
            res.redirect('/')
        }
    })
    app.get('/pool', (req, res) => {
        if(req.isAuthenticated()) {
            res.render('pool')
        }
        else {
            res.redirect('/')
        }
    })
    app.post('/pool', (req,res) => {
        if(req.isAuthenticated()) {
            var connection = mysql.createConnection(
                {
                    host: 'localhost',
                    user: 'root',
                    password: '12345678',
                    database: 'OpenPool'
                }
            )
            var logged_in_user = req.session.passport.user
            var from = req.body.from
            var to = req.body.to
            console.log
            var find_pool_q = 'select contact_number, t_on from vehicle inner join users on users.user_id = vehicle.user_id  where (t_from = ?) and (t_to = ?)'
            connection.query(find_pool_q, [from, to], (err2, res2) =>{
                if(err2) throw err2;
                var data = res2;
                res.render("trips", {data: JSON.stringify(data)})
                connection.end();
                console.log(res2[0]);

            })

        }
    })
    app.get('/changepass', (req, res) =>{
        if(req.isAuthenticated()) {
            res.render('changepass')
        }
    })
    app.post('/changepass', (req, res) => {
        if(req.isAuthenticated()) {
            var logged_in_user = req.session.passport.users
            var newpass = req.body.new_pass
            var connection = mysql.createConnection(
                {
                    host: 'localhost',
                    user: 'root',
                    password: '12345678',
                    database: 'OpenPool'
                }
            )
            update_pass_q = `update users set password = ${newpass} where user_id = ${logged_in_user};`
            connection.query(update_pass_q, (err2, res2) =>{
                res.redirect('/');
            })
            
        }
        else {
            res.redirect('/')
        }
    })
    app.get('/deleteacc', (req,res)=>{
        if(req.isAuthenticated()) {
            var logged_in_user = req.session.passport.user
            var connection = mysql.createConnection(
                {
                    host: 'localhost',
                    user: 'root',
                    password: '12345678',
                    database: 'OpenPool'
                }
            )
            del_trip_q = `delete from vehicle where user_id = ${logged_in_user}`
            connection.query(del_trip_q, (err3, res3) =>{

                del_q = 'delete from users where user_id = ?'
                connection.query(del_q,[logged_in_user], (err2, res2)=> {
                res.redirect('/')
            })
            })
            
 
        }
        else {
            res.redirect('/')
        }
    })

app.listen(port, () => {
    console.log("OpenPool app listening to Port - "+port)
})