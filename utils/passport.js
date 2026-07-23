const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const usermodel = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.googcid,
      clientSecret: process.env.googsec,
      callbackURL: "https://movieplex-movie-recommendation-system.onrender.com/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {

      let user = await usermodel.findOne({
        email: profile.emails[0].value,
      });
       

      if(!user){
        user = await usermodel.create({
          username: profile.displayName || profile.username,
          email: profile.emails[0].value,
          image: profile.photos[0].value,
          googleId: profile.id,
          provider: "google"
        });
      }else{
    user.image = profile.photos[0].value;
    user.googleId = profile.id;
    user.provider = "google";
    await user.save();
      }

      return done(null, user);
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.gitid,
      clientSecret: process.env.gitsec,
      callbackURL: "https://movieplex-movie-recommendation-system.onrender.com/auth/github/callback",
    },

    async (accessToken, refreshToken, profile, done) => {

      let user;
      let email = null;

if (profile.emails) {
    email = profile.emails[0].value;
}

if (email) {
    user = await usermodel.findOne({ email });
} else {
    user = await usermodel.findOne({ githubId: profile.id });
}

      if(!user){
        user = await usermodel.create({
          username: profile.displayName || profile.username,
          email,
          image: profile.photos[0].value,
          githubId: profile.id,
          provider: "github"
        });
      }
       console.log(profile);
      return done(null, user);
    }
  )
);



passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    let user = await usermodel.findById(id);
    done(null, user);
});