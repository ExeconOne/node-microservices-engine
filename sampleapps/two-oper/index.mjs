// const moment = require('moment');
import moment from 'moment';


export default (app, basePath) => {
  app.get(`${basePath}/time`, (req, res) => {
    res.json({ currentTime: moment().format() });
  });
};