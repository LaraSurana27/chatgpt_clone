const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    user : { // stores the User’s _id
        type : mongoose.Schema.Types.ObjectId, //This field will store the _id of another MongoDB document.
        ref : 'user', // tells Mongoose which model it belongs to
        required : true,
    },
    title : {
        type : String,
        required : true,
    },
    lastActivity : {
        type : Date,
        default : Date.now,
    }
}, {
    timestamps : true,
})

const chatModel = mongoose.model("chat", chatSchema)

module.exports = chatModel
