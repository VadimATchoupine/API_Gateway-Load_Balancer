// File: ./models/server.js

// Require Mongoose
var mongoose = require('mongoose');
var axios = require('axios');

var ServerTest = require('./server-model');

// Define a schema
var Schema = mongoose.Schema;

var RecordSchema = new Schema(
    {
        content_type: {
            type: String,
            enum: ['image', 'video'], // + HTML5, Gif
            required: [true, 'content_type prop is required']
        },
        callbackUrl: {
            type: String,
            required: [true, 'callbackUrl prop is requiresd']
        },
        quality: {
            type: String,
            enum: ['270p', '360p', '480p', '540p', '720p', '1080p'],
            required: [true, 'quality prop is required'] 
        },
        status: {
            type: String,
            enum: ['pending', 'handling', 'canceled', 'failed', 'done'],
            required: [true, 'status prop is required']
        },
        zipPath: {
            type: String,
            required: [true, 'zipPath prop is required']
        },
        projectID: {
            type: String,
            required: [true, 'projectID prop is required']
        },
        actions: {
            type: [Schema.Types.Mixed]
        },
        videoOptions: {
            watermark: Boolean,
            fps: Number,
            quality: String,
            maxDuration: Number,
            aspect: {
                x: Number,
                y: Number
            }
        },
        consumerID: {
            type: Schema.Types.ObjectId
        }
    },
    {
        timestamps: true
    }
);

// TODO: add description
RecordSchema.pre('save', async function (next) {
    if (this.content_type === 'video' && this.quality != '270p') { // TODO: rewrite 
        let result = await ServerTest.findOne({ content_type: this.content_type });
        this.consumerID = result._id;
    } else {
        let result = await ServerTest.findOne({ content_type: 'image' });
        this.consumerID = result._id;
    }

    // PREVIOUS LOGIC
    // let result = await ServerTest.findOne({ content_type: this.content_type });
    // this.consumerID = result._id;

    // call the next function in pre-save chain
    next();
});

// TODO: add description
RecordSchema.statics.checkSameRec = async function (projectID, quality, contentType, token) {

    await RecordModel.findOne({projectID: projectID, quality: quality, content_type: contentType, status: 'handling'}, async (err, rec) => {
        if (err) { throw err }
        else if (rec != null) {
            let server = await ServerTest.findById(rec.consumerID)
            await axios.get(`http://${server.host}:${server.port}/cancel/${rec._id}`, {headers: {Authorization: `Bearer ${token}`}}) // TODO: response and errors FIXME: eed to be sure that record_id it is enough for request 
        }
    })

    await RecordModel.findOne({projectID: projectID, quality: quality, content_type: contentType, status: 'pending'}, async (err, rec) => {
        if (err) { throw err }
        else if (rec != null) {
            rec.status = 'canceled'
            rec.save()
        }
    })

};

// FIXME:TODO: add description
RecordSchema.statics.updateStatus = function (id, status) {
    RecordModel.findById(id, (err, rec) => {
        if (err || rec === null) { throw err }
        else if (rec != null) {
            rec.status = status
            rec.save() 
        }
    })
};

// FIXME: rewrite
// TODO: add description
// RecordSchema.statics.refreshQueue = function (token) {
//     RecordModel.findOne({status: 'pending'}, (err, record) => {
//         if (err) { throw err }
//         else if (record != null) {
//             ServerTest.findById({_id: record.consumerID}, (err, server) => {    
//                 if (err) { throw err }
//                 else if (server != null) {
//                     if (server.status === 'idle') { // FIXME: need a specific data about what doest it means IDLE and BUSY
//                         axios.post(`http://${server.host}:${server.port}/render`, record, {headers: {Authorization: `Bearer ${token}`}}) // TODO: add route on render side
//                         .then( async () => {
//                             await ServerTest.updateLoadAndStatus(server._id, 'handling')
//                             await RecordModel.updateStatus(record._id, 'handling')                        
//                         })
//                     }
//                     else if (server.status === 'busy') {
//                         ServerTest.findOne({status: 'idle'}, (err, server) => {
//                             if (err) { throw err }
//                             else if (server === null) {
//                                 console.log(':: SORRY ALL SERVERS ARE BUSY ::')
//                             }
//                             else if (server != null) {
//                                 if (server.content_type === 'image') {
//                                     RecordModel.findOne({content_type: server.content_type}, (err, rec) => {
//                                         if (err) { throw err }
//                                         else if (rec === null) {
//                                             RecordModel.findOne({content_type: 'video', quality: '270p'}, (err, rec) => {
//                                                 if (err) { throw err }
//                                                 else if (rec === null) { console.log(':: NO PENDING RECORDS ::') }
//                                                 else if (rec != null) {
//                                                     axios.post(`http://${server.host}:${server.port}/render`, rec, {headers: {Authorization: `Bearer ${token}`}})
//                                                     .then( async () => {
//                                                         await ServerTest.updateLoadAndStatus(server._id, 'handling')
//                                                         await RecordModel.updateStatus(server._id, 'handling')
//                                                         // RecordModel.refreshQueue()
//                                                     })                                                    
//                                                 }
//                                             })
//                                         }
//                                         else if (rec != null) {
//                                             axios.post(`http://${server.host}:${server.port}/render`, rec, {headers: {Authorization: `Bearer ${token}`}})
//                                             .then( async () => {
//                                                 await ServerTest.updateLoadAndStatus(server._id, 'handling')
//                                                 await RecordModel.updateStatus(server._id, 'handling')
//                                                 // RecordModel.refreshQueue()
//                                             })
//                                         }
//                                     })
//                                 }
//                                 else if (server.content_type === 'video') {
//                                     RecordModel.findOne({content_type: server.content_type}, (err, rec) => {
//                                         if (err) { throw err }
//                                         else if (rec === null) {':: NO PENDING RECORDS ::'}
//                                         else if (rec != null) {
//                                             if (rec.quality != '270p') {
//                                                 axios.post(`http://${server.host}:${server.port}/render`, rec, {headers: {Authorization: `Bearer ${token}`}})
//                                                 .then( async () => {
//                                                     await ServerTest.updateLoadAndStatus(server._id, 'handling')
//                                                     await RecordModel.updateStatus(server._id, 'handling')
//                                                     // RecordModel.refreshQueue()
//                                                 })                                                
//                                             } else {
//                                                 ServerTest.findOne({_id: rec.consumerID, status: 'idle'}, (err, server) => {
//                                                     if (err) { throw err }
//                                                     else if (server === null) { console.log(':: refreshQueue: ALL SERVERS ARE BUSY ::')}
//                                                     else if (server != null) {
//                                                         axios.post(`http://${server.host}:${server.port}/render`, rec, {headers: {Authorization: `Bearer ${token}`}})
//                                                         .then( async () => {
//                                                             await ServerTest.updateLoadAndStatus(server._id, 'handling')
//                                                             await RecordModel.updateStatus(server._id, 'handling')
//                                                             // RecordModel.refreshQueue()                                                        
//                                                         })
//                                                     }
//                                                 })
//                                             }
//                                         }
//                                     })
//                                 }
                                
//                             }
//                         })

//                     }
//                 } else { console.log(':: NO SERVER WITH THAT SPECIFIC ID ::') }
//             })
//         } else { console.log(':: NO PENDING RECORDS IN QUEUE ::') }
//     })
// };


// Export function to create "Server" model class / Compile model from schema
const RecordModel = mongoose.model('Record', RecordSchema);
module.exports = RecordModel;