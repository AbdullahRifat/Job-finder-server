const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

require('dotenv').config()

app.use(cors(
   {
    origin:[
        'http://localhost:5173', 'http://localhost:3000'
    ],
    credentials:true
   }
));
app.use(express.json())




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxdqwus.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const allJobs = client.db('jobDB').collection('alljobs')
    const appliedJobs = client.db('jobDB').collection('appliedjobs')


    //auth
    app.post('/jwt',async(req, res)=>{
      const user = req.body;
      console.log(user)

      const token = jwt.sign(user,'secret',{expiresIn:'1000h'})
      res.send(token)

  })







    //getting all jobs


    app.get('/brands',async (req,res)=>{
    
      const cursor =  phonesCollection.find()
      const result = await cursor.toArray()
      res.send(result);

  })
    app.get("/alljobs", async (req, res) => {
      const cursor = allJobs.find();
      const result = await cursor.toArray()
      res.send(result) // Return the job data as JSON
    });

    app.get("/jobdetails/:jobid", async (req, res) => {
      const jobid = req.params.jobid;
    
      const filter = { _id: new ObjectId(jobid) }
     
      const job = await allJobs.findOne(filter);
   
 
      res.send(job) // Return the job data as JSON
    });

    //posting jobs
    app.post('/alljobs',async (req,res)=>{
        const newjob= req.body;
        console.log(newjob);
        const result = await allJobs.insertOne(newjob)
        res.send(result);

    })
  //   //aplying
  //   app.post('/applyjobs',async (req,res)=>{
  //     const newjob= req.body;
  //     console.log(newjob);
  //     const result = await appliedJobs.insertOne(newjob)
  //     res.send(result);

  // })
    //updatingjobs
    // app.get('/updatejob/:jobid',async (req,res)=>{
    //   const jobid = req.params.jobid;
    
    //   const filter = { _id: new ObjectId(jobid) }
     
    //   const job = await allJobs.findOne(filter);
    //   res.send(job)

    // // })
    // app.get("/jobdetails/:jobid", async (req, res) => {
    //   const jobid = req.params.jobid;
    
    //   const filter = { _id: new ObjectId(jobid) }
     
    //   const job = await allJobs.findOne(filter);
    
 
    //   res.send(job) // Return the job data as JSON
    // });

    app.put('/updatejob/:jobid',async (req,res)=>{
      const jobid = req.params.jobid;
      console.log(jobid)
    
      const filter = { _id: new ObjectId(jobid) }
      console.log(filter)
     const updatejob = req.body
     
     const updateDoc = {
      $set: updatejob,
    };

      const options = { upsert: true };
      
      const result = await allJobs.updateOne(filter, updateDoc, options);
      console.log(result)
      res.send(result)

    })

    //delete
    app.delete('/delete/:jobid',async (req,res)=>{
      const jobid = req.params.jobid;
      const query = {_id: new ObjectId(jobid)};
      const result = await allJobs.deleteOne(query)
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
});