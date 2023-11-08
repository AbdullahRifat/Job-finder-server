const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

require('dotenv').config()



app.use(cors(
   {
    origin:['http://localhost:5173']
    ,
    credentials:true
   }
));
app.use(express.json())
app.use(cookieParser());

//customs middlewire
const logger = (req, res, next) => {
  console.log('log: info', req.method, req.url);
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // no token available 
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded;
      next();
  })
}




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
    

      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'100h'})
      res
      .cookie('token',token,{
        httpOnly: true,
        secure:false,
       
        path: '/',
      })
      .send({success:true})

  })
  //clearing cookies
  app.post('/logout',async(req,res)=>{
      const user = req.body;
      res.clearCookie('token',{maxAge:0}).send({success:true})
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

    app.get("/jobdetails/:jobid",verifyToken ,async (req, res) => {
     

      const jobid = req.params.jobid;
      
      const filter = { _id: new ObjectId(jobid) }
     
      const job = await allJobs.findOne(filter);
   
 
      res.send(job) // Return the job data as JSON
    });

    //posting jobs
    app.post('/alljobs',async (req,res)=>{
        const newjob= req.body;
     
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

    app.put('/updatejob/:jobid', verifyToken, async (req, res) => {
      const jobid = req.params.jobid;
    
      const filter = { _id: new ObjectId(jobid) };
      const job = await allJobs.findOne(filter);
    
      if (!job) {
        return res.status(404).send({ message: 'Job not found' });
      }
    
      // Check if the user is authorized to update this job
      if (req.user.email !== job.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }
    
      const updatejob = req.body;
      const updateDoc = {
        $set: updatejob,
      };
    
    
      const options = { upsert: true };
    
      const result = await allJobs.updateOne(filter, updateDoc, options);
    
      res.send(result);
    });
    
    //
    app.get('/updatejob/:jobid',logger, verifyToken, async (req, res) => {
      const jobid = req.params.jobid;
      const filter = { _id: new ObjectId(jobid) };
      const job = await allJobs.findOne(filter);
      console.log(req.user.email)
    
      if (!job) {
        return res.status(404).send({ message: 'Job not found' });
      }
      console.log(req.user.email)
      // Check if the user is authorized to update this job
      
      if (req.user.email !== job.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }
    
      res.send(job);
    });

    //delete

    app.get('/myjobs',verifyToken,async(req,res)=>{



      if(req?.user?.email !== req?.query?.email) {
        console.log(req.user.email,req.params.email)
        console.log("unnnnnnn")
        return res.status(403).send({ message: 'Forbidden access' });
      }
      let query = {};


      if(req.query?.email){
        query = {email:req.query.email}
      }
      
      const result = await allJobs.find(query).toArray()
      res.send(result)

    })
    //applied jobs
    app.get('/appliedjobs', verifyToken, async (req, res) => {
      console.log(req.query.email)
      if (req.user.email !== req.query.email) {
        console.log(req.user.email, req.query.email);
        console.log("unnnnnnn");
        return res.status(403).send({ message: 'Forbidden access' });
      }
    
      let query = {};
    
      if (req.query.email) {
        query = { applyemail: { $elemMatch: { $eq: req.query.email } } };
      }
    
      const result = await allJobs.find(query).toArray();
      res.send(result);
    });


    //apply jobs
app.post('/applyjob/:jobid',verifyToken, async (req, res) => {
  const jobid = req.params.jobid;
  const filter = { _id: new ObjectId(jobid) };
  const job = await allJobs.findOne(filter);

  if (!job) {
    return res.status(404).send({ message: 'Job not found' });
  }
  console.log(req.user.email)
  const user = req?.user;
  const userEmail = user?.email;

  // Check if the user has already applied for the job
  if (job.applyemail.includes(userEmail)) {
    return res.status(400).send({ message: 'You have already applied for this job.' });
  }

  // Update the applyemail array by pushing the user's email
  job.applyemail.push(userEmail);

  const updateData = {
    jobApplicants: (parseInt(job.jobApplicants, 10) || 0) + 1,
    applyemail: job.applyemail,
  };

  const updateDoc = {
    $set: updateData,
  };

  const options = { upsert: true };

  // Send a PUT request to update the job with the new application data
  const result = await allJobs.updateOne(filter, updateDoc, options);

  res.send(result);
});





    app.delete('/myjobs/:jobid',async (req,res)=>{

      // if(req.user.email !== req.query.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }
      const jobid = req.params.jobid;
      console.log(jobid)
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


app.get('/', (req, res) => {
  res.send('server on')
})
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
});