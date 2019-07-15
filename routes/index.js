
var express = require('express')
var mongoose = require('mongoose');
var router  = express.Router()
router.use(express.json())
router.use(express.urlencoded())

var axios = require('axios')
var chalk = require('chalk')

var ServerTest = require('../models/server-model')
var RecordTest = require('../models/record-model')

// TODO:FIXME:
// add rotes 3.3.1, 3.3.2








































// --------------------- 3.1. DASHBOARD - LOCAL ---------------------

router.get('/indexO', (req, res, next) => {
    res.send('TEST')
})

 // 3.1.
router.get('/index', function (req, res) {

    var promises = [
        ServerTest.find().lean().exec(),
        RecordTest.find().lean().exec()
    ]

    Promise.all(promises).then(function(results) {
        // console.log('DBG: ', results)

        res.render('index', {
            title: 'Load Balancer',
            message: 'API Gateway / Load Balancer',
            servers: SERVERS.data,
            serversT: results[0],
            queue: QUEUE.data,
            recordT: results[1]
        });        

    }).catch(function(err) {
        console.log(err)
    })
    


    /*
    const serversT = ServerTest.find({}, (error, docs) => {
        if (error) return console.log(`Error has occured: ${error}`)
        // console.log(serversT)
        // console.log(docs)
        return (docs)
    });
    */

    /*
    ServerTest.find({}, function (err, doc) {
        if (err) console.log(err)
        else {
            console.log('Retrive objects 1', doc)
            var docc = doc.toISOString();
            console.log('Retrive objects 2', docc)
        }
    })
    console.log('Retrive objects 3', docc)
    */
    
    // router.route('/:id')
    // .get(function(req, res) {
    //   mongoose.model('Blob').findById(req.id, function (err, blob) {
    //     if (err) {
    //       console.log('GET Error: There was a problem retrieving: ' + err);
    //     } else {
    //       console.log('GET Retrieving ID: ' + blob._id);
    //       var blobdob = blob.dob.toISOString();
    //       blobdob = blobdob.substring(0, blobdob.indexOf('T'))
    //       res.format({
    //         html: function(){
    //             res.render('blobs/show', {
    //               "blobdob" : blobdob,
    //               "blob" : blob
    //             });
    //         },
    //         json: function(){
    //             res.json(blob);
    //         }
    //       });
    //     }
    //   });
    // });



    /*
    res.render('index', {
        title: 'Load Balancer',
        message: 'API Gateway / Load Balancer',
        servers: SERVERS.data,
        serversT: serversT,
        queue: QUEUE.data
    });
    */
});
// 3.3. ONLY FOR TEST
/*
router.get('/getstatusone', (req, res) => { // FIXME: del
    rqst('http://127.0.0.1:4000/heartbeat', (err, response, body) => {
        if (!err && response.statusCode == 200) {
            const data = JSON.parse(body);
            res.json({
                message: '/getstatus',
                data: data
            });
        };
    });
});
*/
// 3.4. ONLY FOR TEST
/*
router.get('/getstatustwo', (req, res) => { // FIXME: del
    rqst('http://127.0.0.1:4001/heartbeat', (err, response, body) => {
        if (!err && response.statusCode == 200) {
            const data = JSON.parse(body);
            res.json({
                message: '/getstatus',
                data: data
            });
        };
    });
});
*/

router.get('/statusQ', (req, res) => { // FIXME:  del
    res.send(QUEUE);
});
// 3.2.
router.get('/heartbeat', function (req, res) {
	var status = {
		success: true,
		address: server.address().address,
		port: server.address().port
	};
	res.send(status);
});



// ---------------------------- SERVER ----------------------------
// 1.
router.post('/registerserver', (req, res) => {
    let newServ = {
        id: req.body.id,
        port: req.body.port,
        host: req.body.host,
        content_type: req.body.content_type,
        max_capacity: req.body.max_capacity,
        load: req.body.load,
        status: req.body.status
    };
    SERVERS.add(newServ);
    console.log('New server have been succesfully registered.');
    res.send(200);
});
// 2.
router.get('/removeserver/:id', (req, res) => {
    let id = req.params.id;
    SERVERS.deleteServerById(id);
    res.send(200);
});


// ---------------------------- RECORDS ----------------------------

router.post('/registerrecord', (req, res) => {
    // assign appropriate server for this type of rec
    let consumerID = SERVERS.findServerByType(req.body.type);
    // get all required data from req for a new rec
    let newRec = {
        id: req.body.id,
        type: req.body.type,
        status: req.body.status, // or virtual property
        url: req.body.url,
        custom: req.body.custom,
        consumerID: consumerID,
        date: new Date().toISOString()
    };
    // add new rec
    console.log('DEBUG: ' + QUEUE.checkSameRec(newRec)); // FIXME:
    QUEUE.add(newRec);
    QUEUE.statusUpdate(SERVERS);
    res.send(200, newRec);
});
// 3.5. ONLY FOR TEST
router.get('/addrecord', (req, res) => {
    // generate random content type property
    let possibleContentType = ['A', 'B'];
    let random = Math.floor(Math.random() * possibleContentType.length);
    let generatedRecContentType = possibleContentType[random];
    // generate unique id property
    let id = crypto.randomBytes(4).toString("hex");
    // assign appropriate server for this type of rec
    let consumerID = SERVERS.findServerByType(generatedRecContentType);
    // create new rec
    let newRec = {
        id: id,
        type: generatedRecContentType,
        status: 'pending',
        url: 'http://smth.com',
        custom: 'smth',
        consumerID: consumerID,
        date: new Date().toISOString()
    };
    // FIXME:TODO:
    QUEUE.add(newRec);
    QUEUE.statusUpdate(SERVERS);
    res.send(200, newRec);
});

// 3.6. ONLY FOR TEST
router.get('/addrecordA', (req, res) => {
    let id = crypto.randomBytes(4).toString("hex");
    let contentType = 'A';
    let consumerID = SERVERS.findServerByType(contentType);
    let newRec = {
      id: id,
      type: contentType,
      status: 'pending',
      url: 'http://smth.com',
      custom: 'smth',
      consumerID: consumerID,
      date: new Date().toISOString()      
    };
    QUEUE.add(newRec);
    QUEUE.statusUpdate(SERVERS);
    res.send(200, newRec);
});
// 3.7. ONLY FOR TEST
router.get('/addrecordB', (req, res) => {
    let id = crypto.randomBytes(4).toString("hex");
    let contentType = 'B';
    let consumerID = SERVERS.findServerByType(contentType);
    let newRec = {
      id: id,
      type: contentType,
      status: 'pending',
      url: 'http://smth.com',
      custom: 'smth',
      consumerID: consumerID,
      date: new Date().toISOString()
    };
    QUEUE.add(newRec);
    QUEUE.statusUpdate(SERVERS);
    res.send(200, newRec);
});
// 3.8. ONLY FOR TEST
router.get('/finishedA', (req, res) => {
    let finishedRec;
    let status = 'done';
    for (let i = QUEUE.data.length - 1; i >=0; --i) {
        if (QUEUE.data[i].status === 'handling' && QUEUE.data[i].type === 'A') {
            finishedRec = QUEUE.data[i];
            break;
        };
    };
    SERVERS.servStatusUpdate(finishedRec.consumerID, status);
    QUEUE.recStatusUpdate(finishedRec.id, status);
    QUEUE.statusUpdate(SERVERS);
    res.send(200);
});
// 3.9. ONLY FOR TEST
router.get('/finishedB', (req, res) => {
    let finishedRec;
    let status = 'done';
    for (let i = QUEUE.data.length - 1; i >=0; --i) {
        if (QUEUE.data[i].status === 'handling' && QUEUE.data[i].type === 'B') {
            finishedRec = QUEUE.data[i];
            break;
        };
    };
    SERVERS.servStatusUpdate(finishedRec.consumerID, status);
    QUEUE.recStatusUpdate(finishedRec.id, status);
    QUEUE.statusUpdate(SERVERS);
    res.send(200);
});
// 3.10. ONLY FOR TEST
router.get('/finishedRec', (req, res) => {
    let finishedRec;
    let status = 'done';
    for (let i = QUEUE.data.length - 1; i >= 0; --i) {
        if (QUEUE.data[i].status === 'handling') {
            finishedRec = QUEUE.data[i];
            break;
        };
    };
    SERVERS.servStatusUpdate(finishedRec.consumerID, status);
    QUEUE.recStatusUpdate(finishedRec.id, status);
    QUEUE.statusUpdate(SERVERS);
    res.send(200);
})
// 3.11.
// FIXME:TODO: add a route to create a Rec w/ client
// 3.12.
router.get('/finishedRecById/:id/:status', (req, res) => {
    let id = req.params.id;
    // let status = 'done';
    let status = req.params.status;
    let index = QUEUE.findIndexById(id);
    let finishedRec = QUEUE.data[index];
    console.log(id, status, index, finishedRec);
    SERVERS.servStatusUpdate(finishedRec.consumerID, status);
    QUEUE.recStatusUpdate(finishedRec.id, status);
    QUEUE.statusUpdate(SERVERS);
    res.send(200);
});




module.exports = router