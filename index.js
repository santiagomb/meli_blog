var
    http = require("http"),
    url = require("url"),
    fs = require("fs"),
    path = require("path"),
    mime = require("mime"),
    mu = require("mu2"),
    express = require("express"),
    manejadorDeBlog = require("./modules/manejadorDeBlog"),
    body = require('body-parser'), // para leer parametros del post. query es para get
    mongoose = require('mongoose'); // MONGO DB

var err = '404.html';
var tituloBlog = 'Probando Mustache {{';

var app = express();
app.use(express.static('public'));
app.use(body.json());
app.use(body.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

/*
 #####################################
 ############  BEGIN MONGO  ##########
 #####################################
 */
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var userSchema = new Schema({
    userID: { type: ObjectId },
    email: { type: String },
    password: { type: String }
});

var postSchema = new Schema({
    titulo: { type: String },
    contenido: { type: String },
    autor: { type: String },
    fecha: { type: String },
    comentarios: { type: String }
});

mongoose.connect('mongodb://localhost:27017/usersBlog', function(err, db) {
    if(err) throw err;
    console.log('Connected to Database');
});

var blogUser = mongoose.model('users', userSchema);
var blogPost = mongoose.model('posts', postSchema);
//blogUser.find({}, function (err, data){ console.log(err, data)});

/*
 ####################################
 ############ END MONGO  ############
 ####################################
 */

// crear un post (V2)
app.get("/newpost", function(req, res) {
    res.redirect('/viewposts');
});

app.post("/getpost", function(req, res) {
    manejadorDeBlog.createPost(req.body.title, req.body.content, 1, req.body.autor);
    res.redirect('/viewposts');
});

app.post("/getuser", function(req, res){
    var object = req.body;
    var user = object.mail;
    var pass = object.pass;
    blogUser.find({email: user, password: pass}, function (err, data){
        if(data.length != 0){
            mu.clearCache();
            var ultimosPosts = manejadorDeBlog.posts;
            var stream = mu.compileAndRender('./public/posts.html', {title: tituloBlog, subtitle: 'Últimos posts',
                user: user, posts: ultimosPosts.slice(0,3)});
            stream.pipe(res);
        }else{
            console.log("Pass o usuario incorrecto");
            res.send(500, 'wrongLogin');
        }
    });
});

app.get("/", function(req, res) {

});

app.get("/signup", function(req, res) {
    res.sendFile(path.join(__dirname + '/public/signup.html'));
});

app.post("/signupuser", function(req, res){
    var object = req.body;
    var user = object.mail;
    var pass = object.pass;
    var existeUser = manejadorDeBlog.createUser(user, pass);
    if (!existeUser){
        res.redirect('signup.html');
    }else{
        res.redirect('/viewposts');
    }
});

app.get("/viewposts", function(req, res){
    mu.clearCache();
    var ultimosPosts = manejadorDeBlog.posts;
    var stream = mu.compileAndRender('./public/posts.html', {title: tituloBlog, subtitle: 'Últimos posts', posts: ultimosPosts.slice(0,3)});
    stream.pipe(res);
});

app.get("/viewallposts", function(req, res){
    mu.clearCache();
    var ultimosPosts = manejadorDeBlog.posts;
    var stream = mu.compileAndRender('./public/posts.html', {title: tituloBlog, subtitle: '', posts: ultimosPosts});
    stream.pipe(res);
});

app.get("/post", function(req, res){
    mu.clearCache();
    var ultimosPosts = manejadorDeBlog.posts;
    var stream = mu.compileAndRender('./public/posts.html', {title: tituloBlog, subtitle: subtitle, posts: ultimosPosts});
    stream.pipe(res);
});

/*
 ####################################
 ############   BEGIN API  ##########
 ####################################
 */
// muestro todos los posts
app.get("/posts", function(req, res) {
    blogPost.find({}, function (err, data) {
        res.end(JSON.stringify(data));
    })
});

// muestro el ultimo post
app.get("/posts/new", function(req, res) {
    blogPost.findOne({}, {}, { sort: { '_id' : -1} }, function (err, data) {
        res.end(JSON.stringify(data));
    })
});

// muestro el post con id pid
/*app.get("/posts/:pid", function(req, res) {
 var id = req.query.pid;
 res.end(JSON.stringify(manejadorDeBlog.getPostByID(id)));
 });*/

app.get("/posts/:pid", function(req, res) {
    var id = req.query.pid;
    blogPost.findById(id, function (err, data) {
        res.end(JSON.stringify(data));
    });
});


// crear un post
// curl -X POST http://localhost:3000/posts/2
app.post("/posts/:uid", function(req, res) {
    var id = req.query.uid;
    res.end(JSON.stringify(manejadorDeBlog.createPost("Un titulo", "Un contenido", id)));
});

// borro el post con id pid
/*app.delete("/posts/:pid", function(req, res) {
 var id = req.query.pid;
 res.end(JSON.stringify(manejadorDeBlog.deletePostByID(id)));
 });
 */

app.get("/users", function (req, res) {
    blogUser.find({}, function (err, data) {
        res.end(JSON.stringify(data));
    })
});

/*
 #################################
 ############  END API  ##########
 #################################
 */

app.listen(process.env.PORT || 3000);