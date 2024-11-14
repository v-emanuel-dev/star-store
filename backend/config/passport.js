const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
  
  const email = profile.emails[0].value;
  const username = profile.displayName.replace(/\s+/g, '').toLowerCase();
  const profilePicture = profile.photos[0]?.value || null;

  User.findByEmail(email, (err, user) => {
    if (err) {
      return done(err);
    }

    if (user) {
      return done(null, user);
    } else {
      User.create({
        email,
        username,
        password: 'dummyhashedpassword',
        profilePicture,
      }, (err, newUser) => {
        if (err) {
          return done(err);
        }
        return done(null, newUser);
      });
    }
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

module.exports = passport;
