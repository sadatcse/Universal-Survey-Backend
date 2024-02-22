const express = require('express');
const cors = require('cors');
require('dotenv').config();
// const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uria = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@test.hofjrlw.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://universal22:MohCUV9zyYMnJMAQ@test.hofjrlw.mongodb.net/?retryWrites=true&w=majority`;

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

    const db = client.db('universal')

    const userCollection = db.collection('User');
    const surveyCollection = db.collection('survey');

    app.post('/users', async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      newUser.role = 'Survey Participant';
      console.log(newUser);
      const existingUser = await userCollection.findOne({ email: newUser.email });
      if (existingUser) {console.log('user already');return res.status(200).send('Email already exists');}
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });


    app.get('/users', async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });

      if (user) {

        res.send(user.role);
      } else {
        res.status(404).send('User not found');
      }
    });


    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });

      if (user) {

        res.send(user);
      } else {
        res.status(404).send('User not found');
      }
    });

    app.patch('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedUser = { ...req.body };
        delete updatedUser._id;
        if (Object.keys(updatedUser).length === 0) {return res.status(400).json({ error: 'No fields to update provided' });}
        const result = await userCollection.updateOne(filter, { $set: updatedUser });
        console.log('Update Result:', result); 
        if (result.matchedCount === 0) {return res.status(404).json({ error: 'User not found' });}
        if (result.modifiedCount === 1) {return res.json({ message: 'User updated successfully' });} 
        else {return res.status(500).json({ error: 'Failed to update user' });}} catch (error) {console.error('Server Error:', error); 
        return res.status(500).json({ error: 'Internal server error' });}
    });
    

    app.get('/get_survey', async (req, res) => {
      try {
        const surveys = await surveyCollection.find().toArray(); 
        res.status(200).send(surveys); 
      } catch (error) {
        res.status(500).send({ message: "Internal server error" }); 
      }
    });


    // create api to get all survey
    app.get('/get_survey/:id', async (req, res) => {
      try {
        const id = req.params.id; 
        const filter = { _id: new ObjectId(id) }; 
        const survey = await surveyCollection.findOne(filter); 
        if (survey) { 
          res.status(200).send(survey); 
        } else {
          res.status(404).send({ message: "No data found" }); 
        }
      } catch (err) {
        res.status(500).send({ message: "Internal server error" }); 
      }
    });






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send(`Universal Server is running`)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})



