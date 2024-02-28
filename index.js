const express = require("express");
const cors = require("cors");
require("dotenv").config();
// const jwt = require('jsonwebtoken');
const { ObjectId } = require("mongodb");
const { MongoClient, ServerApiVersion } = require("mongodb");
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
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("universal");

    const userCollection = db.collection("User");
    const surveyCollection = db.collection("survey");
    const participantCollection = db.collection("participants");

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      newUser.role = "Survey Participant";
      console.log(newUser);
      const existingUser = await userCollection.findOne({
        email: newUser.email,
      });
      if (existingUser) {
        console.log("user already");
        return res.status(200).send("Email already exists");
      }
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });

      if (user) {
        res.send(user.role);
      } else {
        res.status(404).send("User not found");
      }
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });

      if (user) {
        res.send(user);
      } else {
        res.status(404).send("User not found");
      }
    });

    app.patch("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedUser = { ...req.body };
        delete updatedUser._id;
        if (Object.keys(updatedUser).length === 0) {
          return res
            .status(400)
            .json({ error: "No fields to update provided" });
        }
        const result = await userCollection.updateOne(filter, {
          $set: updatedUser,
        });
        console.log("Update Result:", result);
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        if (result.modifiedCount === 1) {
          return res.json({ message: "User updated successfully" });
        } else {
          return res.status(500).json({ error: "Failed to update user" });
        }
      } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    // create api to create participant
    app.post("/create_survey", async (req, res) => {
      const survey = req.body;

      try {
        const id = survey?._id;
        if (id) {
          const filter = { _id: new ObjectId(id) };

          const options = { upsert: false };
          delete survey._id;
          const updateDoc = {
            $set: survey,
          };
          // Update the first document that matches the filter
          const result = await surveyCollection.updateOne(
            filter,
            updateDoc,
            options
          );

          console.log(id);

          res.status(200).send(result);
        } else {
          const result = await surveyCollection.insertOne(survey);
          res.status(200).send(result); // Sending the newly created participant data
          console.log(result);
        }
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // create api to get all survey
    app.get("/get_survey", async (req, res) => {
      try {
        const survey = await surveyCollection.find().toArray();

        res.status(200).send(survey);
      } catch (error) {
        res.status(404).send({ message: "data not found" });
        a;
      }
    });

    // create api to get all survey
    app.get("/get_survey/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const survey = await surveyCollection.findOne(filter);
        res.status(200).send(survey);
      } catch (err) {
        res.status(404).send({ message: "no data found" });
      }
    });

    // create api to delete booking package by id
    app.delete("/delete_survey/:id", async (req, res) => {
      const id = req.params.id;
      const result = await surveyCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.status(200).send(result);
    });

    // create api to create participant
    app.post("/create_participant", async (req, res) => {
      try {
        const participant = req.body;
        if (participant.surveyId && !participant?._id) {
          const filterSurvey = { _id: new ObjectId(participant.surveyId) };
          const singleSurvey = await surveyCollection.findOne(filterSurvey);

          // insertedId
          if (Object.keys(singleSurvey).length > 0) {
            console.log(Object.keys(singleSurvey).length > 0);
            const participantResult = await participantCollection.insertOne(
              participant
            );

            if (participantResult?.acknowledged) {
              const options = { upsert: true };

              const updateDoc = {
                $push: {
                  participantIds: participantResult.insertedId,
                },
              };
              // Update the first document that matches the filter
              const surveyResult = await surveyCollection.updateOne(
                filterSurvey,
                updateDoc,
                options
              );

              res.status(200).send({ surveyResult, participantResult }); // Sending the newly created participant data
            }
          }
        } else {
          if (participant._id) {
            const filter = { _id: new ObjectId(participant?._id) };
            const options = { upsert: true };
            console.log(participant.surveyIds[0]);

            delete participant._id;
            const updateDoc = {
              $set: participant,
            };

            // Update the first document that matches the filter
            const surveyResult = await participantCollection.updateOne(
              filter,
              updateDoc,
              options
            );
            console.log(surveyResult);
            res.status(200).send(surveyResult); // Sending the newly created participant data
          } else {
            const participantResult = await participantCollection.insertOne(
              participant
            );

            res.status(200).send(participantResult); // Sending the newly created participant data
          }
        }

        // res.status(201).send({ message: Object.keys(singleSurvey) }); // Sending the newly created participant data
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // create api to get all survey
    app.get("/get_participant", async (req, res) => {
      try {
        const survey = await participantCollection.find().toArray();

        res.status(200).send(survey);
      } catch (error) {
        res.status(404).send({ message: "data not found" });
        a;
      }
    });

    // create api to get participant by id
    app.get("/get_participant/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const participant = await participantCollection.findOne(filter);

        res.status(200).send(participant);
      } catch (error) {
        res.status(404).send({ message: "data not found" });
        a;
      }
    });

    // create API to get all survey participants
    app.post("/get_participant", async (req, res) => {
      try {
        const participantIds = req.body?.participantIds;
        const filter = {
          surveyId: { $in: participantIds }, // Corrected MongoDB query filter
        };
        const survey = await participantCollection.find(filter).toArray();

        res.status(200).send(survey);
      } catch (error) {
        console.log(error);
        res.status(404).send({ message: "Data not found" });
      }
    });

    app.get("/", (req, res) => {
      res.send(`Universal Server is running`);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
