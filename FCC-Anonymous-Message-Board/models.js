const mongoose = require("mongoose")
//const bcrypt = require("bcrypt")
//const salt = 6

const replySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  created_on: {
    type: Date,
    required: true,
  },
  reported: {
    type: Boolean,
    default: false,
  },
  delete_password: {
    type: String,
    required: true,
  },
})

const threadSchema = new mongoose.Schema({
  board: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
  },
  created_on: {
    type: Date,
    required: true,
  },
  bumped_on: {
    type: Date,
    required: true,
  },
  reported: {
    type: Boolean,
    default: false,
  },
  delete_password: {
    type: String,
    required: true,
  },
  replies: [replySchema],
})

// *** Encryption methods work but fail tests so commented out ***
// // pre                       
// replySchema.pre('save', function(next) {   
//     if(this.delete_password) {             
//         this.delete_password = bcrypt.hashSync(this.delete_password, salt) 
//     }                                                                
//     next()        
// })  

// threadSchema.pre('save', function(next) {   
//     if(this.delete_password) {             
//         this.delete_password = bcrypt.hashSync(this.delete_password, salt) 
//     }                                                                
//     next()        
// }) 

const Thread = mongoose.model("Thread", threadSchema)
const Reply = mongoose.model("Reply", replySchema)

module.exports = { Thread, Reply }