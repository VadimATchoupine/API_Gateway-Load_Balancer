/**
 * 1. MODULES AND DEPENDENCIES
 */
const express = require('express');
const app = express();

const chalk = require('chalk');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const axios = require('axios');

const mongoose = require('mongoose');

const path = require('path');
const loadConfig = require('@agte/config-loader');

const ServerTest = require('./models/server-model');
const RecordTest = require('./models/record-model');



// TODO: routers
// const indexRouter = require('./routes/index'); // FIXME:
// const serverRouter = require('./routes/serverRouter'); // FIXME:
// const recordRouter = require('./routes/recordRouter'); // FIXME:


/**
 * 2. SETTING UP
 */
app.disable('x-powered-by');

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded());

app.set('view engine', 'pug');

// app.use('/', indexRouter);


// LOAD CONFIG:
// const config = require('./config/default')
const config = loadConfig(path.join(__dirname, '/config'))
const API_KEY = config.microservices.renderer.apiKey;


/**
 * 3. ROUTES
 */
// ------------------------------ SERVER ------------------------------
// SERVER ROUTES: 3.1.1. add server
// STATUS: +
app.post('/server', (req, res, next) => {
    ServerTest.create({
        host         : req.body.host,
        port         : req.body.port,
        content_type : req.body.content_type,
        max_capacity : req.body.max_capacity,
        load         : req.body.load
    })
    .then((server) => {
        console.log(chalk.magenta.bold('Server added: ', server));
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(server);
    }, (err) => next(err))
    .catch((err) => next(err));
});
// SERVER ROUTES: 3.1.2. remove server
// STATUS: +
app.delete('/server/:id', (req, res, next) => {
    ServerTest.findByIdAndRemove({_id: req.params.id})
    .then((resp) => {
        console.log(chalk.red.bold('Server removed: ', resp));
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);        
    }, (err) => next(err))
    .catch((err) => next(err));
});

// --------------------------  RECORDS   ------------------------------
// RECORD ROUTES: 3.2.1. add record
// STATUS: +
app.post('/record', async (req, res, next) => { // FIXME:TODO: save transfered data as it is w/o decomposition --- e.g. ref to issue w/ actions and array of objects 

    const token = req.body.token
    
    await RecordTest.checkSameRec(req.body.projectId, req.body.videoOptions.quality, req.body.actions[0].type, token)
    
    RecordTest.create({
        content_type    : req.body.actions[0].type,
        callbackUrl     : req.body.actions[0].callbackUrl,
        actions         : req.body.actions,
        quality         : req.body.videoOptions.quality,
        videoOptions    : req.body.videoOptions,
        status          : 'pending',
        zipPath         : req.body.zipPath,
        projectID       : req.body.projectId
    })
    .then( async (rec) => {
        let server = await ServerTest.findOne({_id: rec.consumerID, status: 'idle'})
        if (server != null && server != undefined) {
            axios.post(`http://${server.host}:${server.port}/render`, rec, {headers: {Authorization: `Bearer ${token}`}})
            ServerTest.updateLoadAndStatus(server._id, 'handling')
            RecordTest.findById(rec._id, (err, rec) => {
                if (err) { throw err }
                else if (rec != null && rec.status === 'pending') {
                    rec.status = 'handling'
                    rec.save()
                }
            })            
        }
        // console.log(chalk.greenBright.bold('Record created: ', rec));
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(rec);
    }, (err) => next(err))
    .catch((err) => next(err))
})
// RECORD ROUTES: 3.2.2. update record 
// STATUS: +
app.put('/record/:id/:status', async (req, res, next) => {

    let id = req.params.id
    let status = req.params.status

    RecordTest.findById(id, async (err, rec) => {
        if (err) { throw err }
        else if (rec != null) {
            await ServerTest.updateLoadAndStatus(rec.consumerID, status)
            rec.status = status
            rec.save()
            return rec
        }
    })
    .then( (rec) => {
        ServerTest.findById(rec.consumerID, (err, server) => {
            if (err) { throw err }
            else if (server != null) {
                RecordTest.findOne({status: 'pending', consumerID: rec.consumerID}, async (err, record) => {
                    if (err) { throw err }
                    else if (record === null) { console.log(chalk.greenBright.bgCyan.bold(`:: DBG MSG :: NO PENDING REC FOR ${rec.consumerID} SERVER.`)) } // FIXME: delete l8r
                    else if (record != null && record.status === 'pending') {

                        // TODO:FIXME: auth issue
                        // const token = jwt.sign({ url: 'https://artur.api.mixapixa.com' }, 'asohtwpef0');
                        // const token = jwt.sign({ url: config.apiUrl }, API_KEY);
                        const token = jwt.sign({ url: 'https://artur.api.mixapixa.com' }, API_KEY);

                        axios.post(`http://${server.host}:${server.port}/render`, record, {headers: {Authorization: `Bearer ${token}`}}) // TODO:FIXME: would not work until headers w/ token
                        await ServerTest.updateLoadAndStatus(server._id, 'handling')
                        record.status = 'handling'
                        record.save()
                    }
                })
            }
        })
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(rec);
    }, (err) => next(err))
    .catch((err) => next(err));
});

// --------------------------------------------------------------------
// RECORD ROUTES: 3.3.1. dashboard page / root route
// STATUS: +
app.get('/', (req, res) => {

    var promises = [
        ServerTest.find().lean().exec(),
        RecordTest.find().lean().exec()
    ]

    Promise.all(promises).then( (results) => {
        // console.log('DBG: ', results)

        res.render('dashboard', {
            title: 'Load Balancer',
            message: 'API Gateway / Load Balancer',
            serversT: results[0],
            recordT: results[1]
        });        

    }).catch( err => {
        console.log(err)
    })

});
// RECORD ROUTES: 3.3.2. handling all non-existing routes
// STATUS: +
app.all('*', (req, res) => {
    res.render('error', {
        title: 'Error',
        message: 'Page not found'
    });
});



/**
 * 4. ERROR HANDLERS
 */
// 4.1. Catch 404 error and forward:
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// 4.2. Handle Error:
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});



/**
 * 5. SERVER and DB LAUNCH
 */
const connectionUrl = ({ username, password, host, port, database }) => {
  if (username && password) {
    user = encodeURIComponent(username);
    password = encodeURIComponent(password);
    return `mongodb://${username}:${password}@${host}:${port}/${database}?authMechanism=SCRAM-SHA-1&authSource=admin`;
  } else {
    return `mongodb://${host}:${port}/${database}`;
  }
};
// Set up default mangoose connection
config.connections.mongodblocal.url = connectionUrl(config.connections.mongodblocal)
const dbOptions = {
    useMongooseClient: true,
    useNewUrlParser: true
}            
mongoose.connect(config.connections.mongodblocal.url, dbOptions);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise
// Get the default connection
var db = mongoose.connection
    .once('open', () => {
        console.log(chalk.bgCyan.greenBright.bold('Mongoose - successful connection!'));
        // After successful DB connection - launch server
        let server = app.listen(config.port, config.host, function () {
            let host = server.address().address;
            let port = server.address().port;
            console.log(chalk.bgGreen.greenBright.bold(`API GATEWAY initialized and accepting request at the following root: http://${host}:${port}`));
        });
    })
    .on('error', error => console.warn(error));
    // .on('error', console.error.bind(console, 'MongoDB connection error: ')); // Bind connection to error event (to get notification of connection errors)

module.exports = app