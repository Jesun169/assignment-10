const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://servicexbdUser:opzODQGZIOyGxS6S@cluster0.lls6dfv.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('ServiceX server is running');
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully!");

    const db = client.db("myDB");
    const servicesCollection = db.collection("services");

    // get
    app.get("/services", async(req,res)=>{
      const cursor=servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/services/:id", async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await servicesCollection.findOne(query);
      res.send(result);
    })
    
    // post
    app.post('/services', async (req, res) => {
      try {
        const newService = req.body;
        if (!newService || Object.keys(newService).length === 0) {
          return res.status(400).send({ error: "Service data is required" });
        }

        const result = await servicesCollection.insertOne(newService);
        res.status(201).send({ message: "Service added successfully", insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to add service" });
      }
    });
    
    // patch
    app.patch("/services/:id",async (req, res)=>{
      const id = req.params.id;
      const updatedServices = req.body;
      const query = {_id:new ObjectId(id)}
      const update = {
        $set:{
          name: updatedServices.name,
          price: updatedServices.price
        }
      }
      const result=await servicesCollection.updateOne(query, update)
      res.send(result);
    })


    // delete
    app.delete("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ID format" });
        }

        const query = { _id: new ObjectId(id) };
        const result = await servicesCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Service not found" });
        }

        res.send({ message: "Service deleted successfully", deletedId: id });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to delete service" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. MongoDB connection verified!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`ServiceX server is running on port: ${port}`);
});
