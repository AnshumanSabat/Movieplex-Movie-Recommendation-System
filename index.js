const express = require('express');
const app = express();
const usermodel=require("./models/user");
const gens = require("./utils/gens");
const gens2 = require("./utils/gens2");
const path= require('path');
const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser=require('cookie-parser'); 
require('dotenv').config();
const tmdb = require('./utils/tmdb');
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());


app.get("/", async function(req,res){
    let username = req.cookies.username;
   const i = parseInt(req.query.i) || 4;
   const j = parseInt(req.query.j) || 4;
    const k = parseInt(req.query.k) || 4;
    const todaysdate = new Date();
    let { data:data1 } = await tmdb.get('/trending/movie/week');
    let { data:data2 } = await tmdb.get('/movie/top_rated');
    let { data:data3 } = await tmdb.get('/movie/popular');
 
 if(!username){return res.render("index", { user: null,m: data1.results,n: data2.results,l: data3.results,i,j,k,todaysdate,gens2 });}
 let user = await usermodel.findOne({username});
 
    return res.render("index",{user,m: data1.results, n: data2.results,l: data3.results,i,j,k,todaysdate,gens2 });
 
});

app.get("/search",async function(req,res){
     const todaysdate = new Date();
     if(!req.query.q){
        return res.redirect("/");
     }
     let useableq = req.query.q;
     let page= parseInt(req.query.page)||1;
    let {data}= await tmdb.get(`/search/movie?query=${req.query.q.trim()}&page=${page}`);
     let username = req.cookies.username;
     if(!username){return res.render("search", { user: null, m :data.results,n : data.total_pages,todaysdate,useableq,gens2,page});}
     let user = await usermodel.findOne({username});
    res.render("search",{user,m :data.results,todaysdate,useableq,gens2,page,n : data.total_pages});
});

app.get("/gsearch/:id",async function(req,res){
     const todaysdate = new Date();
      let gtitle= gens[req.params.id];
     if(gtitle){
         gtitle= gens[req.params.id];
     }
     else{
          gtitle=" not available";
     }
     
    let {data}= await tmdb.get(`/discover/movie?with_genres=${req.params.id}`);
     let username = req.cookies.username;
     if(!username){return res.render("gsearch", { user: null, m :data.results,todaysdate,gtitle,gens2});}
     let user = await usermodel.findOne({username});
    res.render("gsearch",{user,m :data.results,todaysdate,gtitle,gens2});
});

app.get("/mdetails/:id",isloggedin,async function(req,res){
    const todaysdate = new Date();
    let username = req.cookies.username;
     let { data} = await tmdb.get(`/movie/${req.params.id}`);
     let {data:t} = await tmdb.get(`/movie/${req.params.id}/videos`)
    if(!username){return res.render("mdetails", { user: null,d: data,t,todaysdate });} // data idhr undefined hota h so saade yaad rakhliyo isiliye idhr data ayega bs results nhi
 let user = await usermodel.findOne({username});
   res.render("mdetails",{user, d: data,t,todaysdate});
});


app.get("/login",function(req,res){
    res.render("login", { error: null });
})


function isloggedin(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect("/login");
    }
    try {
        let data = jwt.verify(req.cookies.token, "jwt_key");
        req.user = data;
        next(); 
    } catch (err) {
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
   
     bcrypt.compare(password,user.password, function(err,result){
         if(result) {
             let token =  jwt.sign({email:email, userid: user._id},"jwt_key");
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
      let user=  await usermodel.create({
            name,
            username,
            email,
            age,
            password:hash,
          });
          let token =  jwt.sign({email:email, userid: user._id},"jwt_key");
          res.cookie("token",token);
          res.cookie("username", user.username);
          res.redirect("/");
        });
    });

});



app.listen(process.env.PORT ||3000);