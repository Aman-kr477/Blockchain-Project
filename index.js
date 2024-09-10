const express=require('express');
const BlockChain=require('./blockchain');
const bodyParser=require('body-parser');
const PubSub=require('./publishsubscribe');
const request=require("request");


const app=express();

const blockchain=new BlockChain();
const pubsub=new PubSub({blockchain});
const Default_port=6000;
const ROOT_NODE_ADDRESS=`http://localhost:${Default_port}`;
setTimeout(()=>pubsub.broadcastChain(),1000);
app.use(bodyParser.json());
app.get('/api/blocks',(req,res)=>{
    res.json(blockchain.chain)
})
app.post("/api/mine",(req,res)=>{
    const {data}=req.body;
    blockchain.addBlock({data});
    pubsub.broadcastChain();
    res.redirect('/api/blocks');
})
const synChains=()=>{
    request({
        url: `${ROOT_NODE_ADDRESS}/api/blocks`
    },
(error,response,body)=>{
    if(!error && response.statusCode===200){
        const rootChain=JSON.parse(body);
        console.log("Replace chain on sync with",rootChain);
        blockchain.replaceChain(rootChain);
    }
});
};

let PEER_PORT;
if(process.env.GENERATE_PEER_PORT==="true"){
    PEER_PORT=Default_port+Math.ceil(Math.random()*1000);

}
const port=PEER_PORT||Default_port;
app.listen(port,()=>{console.log(`listening to port :${port}`);
synChains();
});