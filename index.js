const fs = require('fs')
const path = require('path')

const express = require('express')
const mapcap = require('mapcap')
const morgan = require('morgan')

const CappedMap = mapcap(Map, 100)
const map = new CappedMap()

const getYouTubeCaption = require('./getVideoCaption')

const app = express();

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))

app.get('log')

app.get('/*', async (req, res) => {
  let videoID = req.query["videoID"]
  let lang = req.query["lang"]

  if(!videoID) {
    res.status(400).send("Missing videoID query parameter")
    return
  }

  // set cache to imporve performance
  // 设置缓存，提高性能
  if(map.has(videoID)) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="captions.txt"');
    res.send(map.get(videoID));
    return null
  } 
  
  getYouTubeCaption(videoID, lang)
    .then((captions) => {
      console.log(captions[0])
      let article = ''
      for(let caption of captions) {
        article += caption.text
        article += ' '
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="captions.txt"');
      res.send(article);
      map.set(videoID, article);
    })
    .catch(error => {
      console.log(error)
      res.status(404).send(error.message)
      })
});

app.listen(3000, () => {
  console.log('Express server initialized');
});