const express = require('express');
const app = express();
const usermodel=require("./models/user");
const ai = require("./utils/openai");
const gens = require("./utils/gens");
const gens2 = require("./utils/gens2");
const path= require('path');
const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');
const { marked } = require("marked");
const cookieParser=require('cookie-parser'); 
require('dotenv').config();
const tmdb = require('./utils/tmdb');
const aic = require('./utils/openai');
const session = require("express-session");
const passport = require("passport");
require("./utils/passport");

app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
  secret: process.env.sessec,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
let basics=` try to use 100-150 words and use bulletins and try to add emojis and talk in english and leave space between each lines    and it should be all about movies  and give them more suggestions and if they talk about specific movies find movie ids which are integers based on tmdb and only tmbd ids and suppose id = movie ids but write the full movie id in the link  and don,t ever forget to give them a link to https://movieplex-movie-recommendation-system.onrender.com/mdetails/id and the link should be in blue colour with a underline `

app.post("/ai", async function(req, res) {
    let pro = req.body.aiwaladata;
 

  
        const product = await aic.post("/interactions", {
            model: "gemini-3.5-flash-lite",
            input: pro+basics
        });

 const airep = product.data.steps.at(-1).content[0].text;

 const mairep = marked.parse(airep)
req.session.product= mairep;
return res.redirect(req.get("Referer"))

    
});
  
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get("/auth/google/callback",
passport.authenticate("google", {
    failureRedirect:"/login"
}),
function(req,res){
   

    let token = jwt.sign(
        {
          email:req.user.email,
          userid:req.user._id
        },
        process.env.jwt_key
    );

    

    res.cookie("token",token);
    res.cookie("username",req.user.username);
    console.log("REQ.USER:", req.user);

    res.redirect("/");
});


app.get(
  "/auth/github",
  passport.authenticate("github", {
    scope: [ "user:email"],
  })
);

app.get("/auth/github/callback",
passport.authenticate("github", {
    failureRedirect:"/login"
}),
function(req,res){
   

    let token = jwt.sign(
        {
          email:req.user.email,
          userid:req.user._id
        },
        process.env.jwt_key
    );

    

    res.cookie("token",token);
    res.cookie("username",req.user.username);

    res.redirect("/");
});

app.get("/", async function(req,res){
    let username = req.cookies.username;
   let product = req.session.product;

   
   const i = parseInt(req.query.i) || 4;
   const j = parseInt(req.query.j) || 4;
    const k = parseInt(req.query.k) || 4;
    const todaysdate = new Date();
    let { data:data1 } = await tmdb.get('/trending/movie/week');
    let { data:data2 } = await tmdb.get('/movie/top_rated');
    let { data:data3 } = await tmdb.get('/movie/popular');
   
 
 if(!username){return res.render("index", { user: null,m: data1.results,n: data2.results,l: data3.results,i,j,k,todaysdate,gens2,product,});}
 let user = await usermodel.findOne({username});
 
    return res.render("index",{user,m: data1.results, n: data2.results,l: data3.results,i,j,k,todaysdate,gens2,product,});
 
});

app.get("/search",async function(req,res){
     const todaysdate = new Date();
     let product = req.session.product;
     if(!req.query.q){
        return res.redirect("/");
     }
     let useableq = req.query.q;
     let page= parseInt(req.query.page)||1;
    let {data}= await tmdb.get(`/search/movie?query=${req.query.q.trim()}&page=${page}`);
     let username = req.cookies.username;
     if(!username){return res.render("search", { user: null, m :data.results,n : data.total_pages,todaysdate,useableq,gens2,page,product});}
     let user = await usermodel.findOne({username});
    res.render("search",{user,m :data.results,todaysdate,useableq,gens2,page,n : data.total_pages,product});
});

app.get("/gsearch/:id",async function(req,res){
     const todaysdate = new Date();
     let product = req.session.product;
      let page= parseInt(req.query.page)||1;
      let gtitle= gens[req.params.id];
     if(gtitle){
         gtitle= gens[req.params.id];
     }
     else{
          gtitle=" not available";
     }
     
    let {data}= await tmdb.get(`/discover/movie?with_genres=${req.params.id}`);
     let username = req.cookies.username;
     if(!username){return res.render("gsearch", { user: null, m :data.results,todaysdate,gtitle,gens2,product});}
     let user = await usermodel.findOne({username});
    res.render("gsearch",{user,m :data.results,todaysdate,gtitle,gens2,product});
});

app.get("/mdetails/:id",isloggedin,async function(req,res){
    const todaysdate = new Date();
    let username = req.cookies.username;
    let product = req.session.product;
     let {data:k}= await tmdb.get(`/movie/${req.params.id}/recommendations`);
     let { data} = await tmdb.get(`/movie/${req.params.id}`);
     let { data:c} = await tmdb.get(`/movie/${req.params.id}/credits`);
     let {data:t} = await tmdb.get(`/movie/${req.params.id}/videos`)
    if(!username){return res.render("mdetails", { user: null,d: data,t,todaysdate,e:c.cast,f:c.crew ,x:k.results,product});} // data idhr undefined hota h so saade yaad rakhliyo isiliye idhr data ayega bs results nhi
 let user = await usermodel.findOne({username});
   res.render("mdetails",{user, d: data,t,todaysdate,e:c.cast,f:c.crew,x:k.results,product});
});


app.get("/login",function(req,res){
    res.render("login", { error: null });
   
});





function isloggedin(req, res, next) {
    if (!req.cookies.token) {
        console.log("token nhi mila yr");
        return res.redirect("/login");
    }
    try {
        let data = jwt.verify(req.cookies.token, process.env.jwt_key);
        req.user = data;
        next(); 
    } catch (err) {
        console.log("jwt margya yr", err.message);  
        return res.redirect("/login");
    }
}

app.get("/register",function(req,res){
    res.render("register",{ error: null });
})


app.get("/logout",function(req,res){
res.cookie("token","");
res.cookie("username","");
res.redirect("/");
});

app.get("/profile", async function(req,res){
    let username = req.cookies.username;
    if(!username){return res.render("profile", { user: null,});}
 let user = await usermodel.findOne({username});
    res.render("profile",{user});
});



app.post("/login", async function(req,res){
   let {email,age,name,password,username} = req.body;
    let user = await usermodel.findOne({email});
   if (!user) {
    return res.render("login", {
        error: "Invalid email or password"
    });
}
 if(user.provider === "google"){
    return res.render("login", {
        error: "Please login using Google"
    });}
 if(user.provider === "github"){
    return res.render("login", {
        error: "Please login using Github"
    });}
   
     bcrypt.compare(password,user.password, function(err,result){
         if(result) {
             let token =  jwt.sign(
  {email: email, userid: user._id},
  process.env.jwt_key
);
          res.cookie("token",token);
           res.cookie("username", user.username);
         return res.redirect("/");
         }
else {
    return res.render("login", {
        error: "Invalid email or password"
    });
}


     })

});






app.post("/register", async function(req,res){
   let {email,age,name,password,username} = req.body;
    let user = await usermodel.findOne({email});
   if (user) {
    return res.render("register", {
        error: "email already exists"
    });};
    
    if(password.length<=8){
         return res.render("register", {
        error: "please enter a password with a length of 8 or more"
    });
    }

    if(age<=13){
         return res.render("register", {
        error: "user must be age of 13 or above to proceed"
    });
    }
    
    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(password,salt,async function(err,hash){
          let user = await usermodel.create({
                name,
                username,
                email,
                age,
                password:hash,
              });
              let token = jwt.sign(
                { email: email, userid: user._id },
                process.env.jwt_key
              );
              res.cookie("token",token);
              res.cookie("username", user.username);
              res.redirect("/");
        });
    });
});



app.listen(process.env.PORT ||3000);
