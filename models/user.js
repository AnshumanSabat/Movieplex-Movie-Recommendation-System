require("dotenv").config();
mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
 const userSchema = mongoose.Schema({
    username:String,
    name:String,
    age:Number,
    email:String,
    password:String,
    image:String,
    googleId:String,
      provider: {
    type: String,
    enum: ["local", "google","github"],
    default: "local",
  },
  prevchat: [String],
 })


 module.exports=mongoose.model('user',userSchema);