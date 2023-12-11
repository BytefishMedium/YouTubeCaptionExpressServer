const express = require('express');
const getYouTubeCaption = require('./getVideoCaption')

const app = express();

app.get('/*', (req, res) => {
  let videoID = req.query["videoID"]
  let lang = req.query["lang"]
  let download = req.query["download"]

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
    })
    .catch(error => {
      console.log(error)
      res.status(404).send(error.message)
      })
});

app.listen(3000, () => {
  console.log('Express server initialized');
});