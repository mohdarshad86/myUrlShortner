const express=require('express')
const mongoose=require('mongoose')
const route=require('../route')
const app=express()
const port=process.env.PORT

app.use(express.json())

mongoose.connect('cluster-string', {useNewUrlParser:true})
.then(()=>{
    console.log("mongodb is connected");
})
.catch((err)=>{
    console.log(err.message);
})

app.use('/', route)

app.listen(port || 3000, ()=>{
console.log(`Server is running on port ${port || 3000}`);
})