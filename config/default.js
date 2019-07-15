module.exports = {
    host: 'localhost',
    port: 3000,
    apiUrl: `http://localhost:3000`,

    connections: {
        mongodb: {
            url: 'mongodb+srv://____:_____@cluster1st-li75m.mongodb.net/test?retryWrites=true'
        },
        mongodblocal: {
            username: '____',
            password: '____',
            host: 'localhost',
            port: 27027,
            database: 'balancerqueue'
        }
    },

    microservices: {
        renderer: {
            apiKey: '____'
        }
    }

};