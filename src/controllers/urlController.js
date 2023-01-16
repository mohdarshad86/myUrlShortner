const urlModel = require("../models/urlModel");
const isValidUrl=require("valid-url");

exports.createUrl = async (req, res) => {};

exports.getUrl = async (req, res) => {

try{
let urlCode= req.params.urlCode;
if(!urlCode) return res.status(400).send({status:false,message:"Put urlCode first"})
if(typeof urlCode!=String) return res.status(400).send({status:false,message:"urlCode is not Valid"})

let urlDetails= await urlModel.findOne({urlCode:urlCode});

if(!urlDetails) return res.status(404).send({status:false,message:"url Not Found"})

let longUrl=urlDetails.longUrl;

return res.status(302).redirect({url:longUrl})

}

catch(error){

return res.status(500).send({status:false,error:error.message})


}








};
