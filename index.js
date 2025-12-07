const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://servicexbdUser:opzODQGZIOyGxS6S@cluster0.lls6dfv.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("ServiceX Server is Running...");
});

async function run() {
  try {
    await client.connect();
    const db = client.db("myDB");
    const servicesCollection = db.collection("services");
    const usersCollection = db.collection("users");
    const bookingsCollection = db.collection("bookings");

    // ---------------- USERS -----------------
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const exists = await usersCollection.findOne({ email: newUser.email });

      if (exists)
        return res.send({ message: "User already exists", user: exists });

      await usersCollection.insertOne(newUser);
      res.send({ message: "User created", user: newUser });
    });

    // ---------------- SERVICES -----------------

    // Get only services created by this provider
    app.get("/services", async (req, res) => {
      const providerEmail = req.query.providerEmail;

      const query = providerEmail ? { email: providerEmail } : {};

      const services = await servicesCollection.find(query).toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const service = await servicesCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!service) return res.status(404).send({ error: "Service not found" });

      res.send(service);
    });

    // Add new service (with provider email)
    app.post("/services", async (req, res) => {
      const newService = req.body;

      if (!newService.email) {
        return res.status(400).send({ error: "Provider email is required" });
      }

      newService.price = Number(newService.price);

      const result = await servicesCollection.insertOne(newService);
      res.send({ insertedId: result.insertedId });
    });

    // Update service
    app.patch("/services/:id", async (req, res) => {
      const id = req.params.id;
      const updates = req.body;

      if (updates.price) updates.price = Number(updates.price);

      const result = await servicesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );

      res.send(result);
    });

    // Delete service
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;

      const result = await servicesCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0)
        return res.status(404).send({ error: "Service not found" });

      res.send({ deletedId: id });
    });

    // ---------------- BOOKINGS -----------------

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      booking.createdAt = new Date();

      const service = await servicesCollection.findOne({
        _id: new ObjectId(booking.serviceId),
      });

      if (!service)
        return res.status(404).send({ error: "Service not found" });

      booking.service_name = service.service_name;
      booking.description = service.description;
      booking.price = service.price;

      const result = await bookingsCollection.insertOne(booking);
      res.send({ insertedId: result.insertedId });
    });

    app.get("/bookings", async (req, res) => {
      const userEmail = req.query.userEmail;

      const bookings = await bookingsCollection
        .find({ userEmail })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(bookings);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;

      const result = await bookingsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0)
        return res.status(404).send({ error: "Booking not found" });

      res.send({ deletedId: id });
    });

    console.log("Connected to MongoDB Successfully!");
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`ServiceX server running on port ${port}`);
});
