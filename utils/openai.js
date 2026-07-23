const axios = require('axios');

const aic = axios.create(
   {
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
   headers:{  "x-goog-api-key": process.env.aikey,
               "Content-Type": "application/json"
              

   }

   
});

module.exports = aic;