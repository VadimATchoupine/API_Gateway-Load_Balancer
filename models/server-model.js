// File: ./models/server.js

// Require Mongoose
var mongoose = require('mongoose');

// Define a schema
var Schema = mongoose.Schema;

var ServerSchema = new Schema(
    {
        port: {
            type: Number,
            required: [true, 'port prop is required']
        },
        host: {
            type: String,
            required: [true, 'host prop is required']
        },
        content_type: {
            type: String,
            enum: ['image', 'video'],
            required: [true, 'content_type prop is required']
        },
        max_capacity: {
            type: Number,
            required: [true, 'max_capacity prop is required']
        },
        load: {
            type: Number,
            default: 0,
            min: 0
        },
        status: {
            type: String,
            enum: ['idle', 'busy'],
            default: 'idle'
        }
    },
    {
        timestamps: true
    }
);

// TODO: add description
ServerSchema.statics.updateLoadAndStatus = function (id, status) {
    ServerModel.findById(id, (err, server) => {
        if (err) { throw err }
        else if (server === null) {
            console.log(`:: SERVER WITH ID ${id} NOT FOUND. ::`)
        }
        else if (server != null) {
            if (status === 'handling') {
                server.load++
                server.status = server.load >= server.max_capacity ? 'busy' : 'idle'
                server.save()
            }
            else if (status === 'done' || status === 'canceled') {
                server.load--
                server.status = server.load >= server.max_capacity ? 'busy' : 'idle'
                server.save()            
            }
        }
    })
};

// Export function to create "Server" model class / Compile model from schema
const ServerModel = mongoose.model('Server', ServerSchema);
module.exports = ServerModel;