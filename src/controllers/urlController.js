const urlModel = require("../models/urlModel");
const isValidUrl = require("valid-url");
const shortId = require("shortid");
const validator = require('validator')
const {promisify} = require('util')
const redis = require('redis');
const axios=require('axios')

const validUrl = /^[a-zA-Z_-]{1}[a-zA-Z0-9_-]*$/


const redisClient=redis.createClient(
  18590, "redis-18590.c305.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("DmLZvRPIlZnh2GoSj5ygnzDdhxoDgzDT", (err)=>{
  if (err) console.log(err);
});

redisClient.on("connect", async ()=>{
  console.log("Redis is Connected");
})

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient)
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)
const SET_EX = promisify(redisClient.EXPIREAT).bind(redisClient)

exports.createUrl = async (req, res) => {
  try {
    let longUrl = req.body.longUrl;
    longUrl = longUrl.trim()

    if (Object.keys(req.body).length == 0) {
        return res.status(400).send({ status: false, msg: "Please enter mendatory url" });
      }

    if (!isValidUrl.isUri(longUrl)) {
        return res.status(400).send({ status: false, msg: "Url is not valid" });
    }

    let isUrlExistInCache = await GET_ASYNC(`${longUrl}`)

    if (isUrlExistInCache) {
      isUrlExistInCache=JSON.parse(isUrlExistInCache)

      return res.status(200).send({status:true, msg: "ShortUrl Already Exist in cache", data:isUrlExistInCache})
    }

    let isUrlExistInDB = await urlModel.findOne({ longUrl: longUrl }).select({_id:0, __v:0});
    
    if (isUrlExistInDB) {
      await SET_ASYNC(`${longUrl}`, JSON.stringify(isUrlExistInDB))
      return res.status(200).send({ status: true, msg: "ShortUrl Already Exist in db", data : isUrlExistInDB });
    }
    
    let urlCode = shortId.generate().toLowerCase();
    
    let shortUrl = "http://localhost:3000/" + urlCode;

    let newObj = {};

    newObj.urlCode = urlCode;
    newObj.longUrl = longUrl;
    newObj.shortUrl = shortUrl;

    await urlModel.create(newObj);

    await SET_ASYNC(`${longUrl}`, JSON.stringify(newObj))
    // await SET_EX(`${longUrl}`, 5); //set expire 60 seconds

    
    return res.status(201).send({ status: true, data: newObj });
    
  } catch (err) {
    return res.status(500).send({ status: false, Error: err.message });
  }

};

exports.getUrl = async (req, res) => {
  try {
    let urlCode = req.params.urlCode;

    if (!urlCode)
      return res.status(400).send({ status: false, message: "Please provide urlCode" });

    if(!validUrl.test(urlCode) || urlCode.length !==9 || !validator.isAlphanumeric(urlCode, "en-US", {ignore:"-,_"} )) return res.status(400).send({ status: false, message: "invalid urlCode" });

    let isUrlExistInCache = await GET_ASYNC(`${urlCode}`)

    if (isUrlExistInCache) {
      isUrlExistInCache = JSON.parse(isUrlExistInCache)
    
      return res.status(302).redirect(isUrlExistInCache);
    }

    let urlDetails = await urlModel.findOne({ urlCode: urlCode });
    
    if (!urlDetails)
      return res.status(404).send({ status: false, message: "url Not Found" });

    let longUrl = urlDetails.longUrl;

    await SET_ASYNC(`${urlCode}`, JSON.stringify(longUrl))

    return res.status(302).redirect(longUrl);
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
