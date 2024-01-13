const he = require('he');
const axios = require('axios');
const { find } = require('lodash');
const striptags = require('striptags');

// download YouTube Caption from video id
async function getYouTubeCaption(videoID, lang) {
  // Return the video page, the source links of captions are in the page
  // 返回视频页面，是个HTML文件。字幕就在这个HTML文件中
  const response = await axios.get(`https://www.youtube.com/watch?v=${videoID}`)
  //console.log(response)

  let data = response.data;

  // * ensure we have access to captions data
  if (!data.includes('captionTracks'))
    throw new Error(`Could not find captions for video: ${videoID}`);

  const regex =  /"captionTracks":(\[.*?\])/;

  const [match] = regex.exec(data);

  const { captionTracks } = JSON.parse(`{${match}}`);
  //console.log(captionTracks)

  const captions = []
  for(let captionTrack of captionTracks) {
    captions.push(captionTrack.languageCode)
  }

  // console.log(captions)
  // 如果用户指定了lang，那么需要校验对应语言的字幕是否存在
  if(lang && !captions.includes(lang)) {
    throw new Error(`Could not find caption for language: ${lang}. Available languages: ${captions.join(', ')}`);
  }

  // 设置lang的默认值，有en选en，没有en就随机选择
  if(!lang){
    if(captions.includes('en'))
      lang = 'en'
    else if (captions.includes('zh-Hans')) // 这才是简体中文的代码，坑了我好久
      lang = 'zh-Hans'
    else if (captions.includes('zh-Hant'))
      lang = 'zh-Hant'
    else
      lang = captions[0]
  }

  let subtitle = find(captionTracks, (captionTrack) => captionTrack.languageCode === lang)
  //console.log(subtitle)

  /*** 参考的Subtitle数据：{
  baseUrl: 'https://www.youtube.com/api/timedtext?v=2lAe1cqCOXo&ei=VJZ2ZZCVBOSH_9EP0MSRuAY&opi=112496729&xoaf=4&hl=en&ip=0.0.0.0&ipbits=0&expire=1702295748&sparams=ip,ipbits,expire,v,ei,opi,xoaf&signature=BFA8ED3BE43E5C388E4A724860D4173D8384A7D2.63910DD2B5C6F99064EBBD277B3F2593F9380B19&key=yt8&lang=en',
  name: { simpleText: 'English' },
  vssId: '.en',
  languageCode: 'en',
  isTranslatable: true,
  trackName: ''
} ***/

  const { data: transcript } = await axios.get(subtitle.baseUrl);
  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter(line => line && line.trim())
    .map(line => {
      const startRegex = /start="([\d.]+)"/;
      const durRegex = /dur="([\d.]+)"/;

      const [, start] = startRegex.exec(line);
      const [, dur] = durRegex.exec(line);

      const htmlText = line
        .replace(/<text.+>/, '')
        .replace(/&amp;/gi, '&')
        .replace(/<\/?[^>]+(>|$)/g, '');

      const decodedText = he.decode(htmlText);
      const text = striptags(decodedText);

      return {
        start,
        dur,
        text,
        };
      });

      // console.log(lines)
      return lines;
}

module.exports = getYouTubeCaption;