const urlModel = require("../models/urlModel");
const isValidUrl = require("valid-url");
const shortId = require("shortid");

exports.createUrl = async (req, res) => {
  try {
    let longUrl = req.body.longUrl;

    if (!longUrl) {
        return res.status(400).send({ status: false, msg: "Url is mandatory..." });
      }
      if (!isValidUrl.isUri(longUrl)) {
        return res.status(400).send({ status: false, msg: "Url is not valid" });
      }



    let getUrl = await urlModel.findOne({ longUrl: longUrl });
    
    if (getUrl) {
      return res.status(200).send({ status: true, msg: "ShortUrl Already generated",urlCode:getUrl.urlCode });
    }

    let urlCode = shortId.generate(longUrl);
    urlCode = urlCode.toLowerCase();

    let shortUrl = "http://localhost:3000/" + urlCode;
    let newObj = {};
    newObj.urlCode = urlCode;
    newObj.longUrl = longUrl;
    newObj.shortUrl = shortUrl;

    const urlDetails = await urlModel.create(newObj);
    return res.status(201).send({ status: true, data: newObj });
  } catch (err) {
    return res.status(500).send({ status: false, Error: err.message });
  }
};

exports.getUrl = async (req, res) => {
  try {
    let urlCode = req.params.urlCode;

    if (!urlCode)
      return res.status(400).send({ status: false, message: "Put urlCode first" });
    if(urlCode.length>9 || urlCode.length<9) return res.status(400).send({ status: false, message: "invalid urlCode" });

    urlCode = urlCode.toLowerCase();

    let urlDetails = await urlModel.findOne({ urlCode: urlCode });

    if (!urlDetails)
      return res.status(404).send({ status: false, message: "url Not Found" });

    let longUrl = urlDetails.longUrl;

    return res.status(302).redirect(longUrl);
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
