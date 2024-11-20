const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let cachedClient = null;
let cachedDb = null;

const uri = process.env.DB_CONNECT;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();
  console.log("Connected to MongoDB successfully");
  const db = client.db("TUM");
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// User Registration
app.post("/admins", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("admins");
    const { email, password } = req.body;

    // Check if an admin with the same email already exists
    const existingAdmin = await users_collection.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        message: "An admin with this email already exists",
      });
    }

    const saltRounds = 10;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new admin
    const result = await users_collection.insertOne({
      ...req.body,
      password: hashedPassword,
    });

    res.json({
      message: "Admin created successfully",
      email,
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering admin");
  }
});

// User Login
app.post("/admin-login", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("admins");
    const { email, password } = req.body;
    const user = await users_collection.findOne({ email });
    if (!user) {
      return res.status(400).send("admin not found");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid password");
    }
    res.json({ message: "success", email });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in");
  }
});

// Get All Users
app.get("/admins", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("admins");
    const result = await users_collection.find().toArray();
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching admins");
  }
});

// Get All Users
app.get("/admins/:email", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("admins");
    const { email } = req.params;
    const result = await users_collection.findOne({ email: email });
    if (!result) {
      return res.status(404).send("admins not found");
    }
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching admins");
  }
});

// Delete User
app.delete("/admins/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("admins");
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await users_collection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "admin not found" });
    }
    res.send({ message: "Admin deleted successfully", result });
  } catch (err) {
    console.error("Error deleting admins:", err);
    res.status(500).send({ message: "Server error" });
  }
});

app.patch("/admins/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("admins");
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updateData = { $set: { status: req.params.status } };
    const result = await users_collection.updateOne(query, updateData);
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "admins not found" });
    }

    res.send({
      message: "admins status updated to agent successfully",
      result,
    });
  } catch (err) {
    console.error("Error updating admins status:", err);
    res.status(500).send({ message: "Server error" });
  }
});

app.post("/notifections", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("notifections");

    // Insert the req.body directly
    const result = await users_collection.insertOne(req.body);

    res.json({
      message: "Notification created successfully",
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering notification");
  }
});

app.get("/notifections", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("notifections");

    // Fetch all notifications
    const notifications = await users_collection.find({}).toArray();

    res.json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching notifications");
  }
});

app.get("/notifections/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("notifections");

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const notification = await users_collection.findOne({
      _id: new ObjectId(id),
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({
      message: "Notification fetched successfully",
      notification,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching notification");
  }
});

app.delete("/notifections/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users_collection = db.collection("notifections");

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const result = await users_collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification deleted successfully",
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting notification");
  }
});

app.post("/carouseldata", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const carousel_collection = db.collection("carouseldata");
    const result = await carousel_collection.insertOne(req.body);

    res.json({
      message: "Carousel data created successfully",
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating carousel data");
  }
});

app.get("/carouseldata", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const carousel_collection = db.collection("carouseldata");

    // Fetch all carousel data documents from the collection
    const results = await carousel_collection.find({}).toArray();

    // If no documents are found
    if (results.length === 0) {
      return res.status(404).json({ message: "No carousel data found" });
    }

    // If documents are found, send them back in the response
    res.json({
      message: "Carousel data retrieved successfully",
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving carousel data");
  }
});

app.get("/carouseldata/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const carousel_collection = db.collection("carouseldata");

    // Get the ID from the request parameters
    const { id } = req.params;

    // Find the document with the given ID
    const result = await carousel_collection.findOne({ _id: new ObjectId(id) });

    // If no document is found
    if (!result) {
      return res.status(404).json({ message: "Carousel data not found" });
    }

    // If document is found, send it back in the response
    res.json({
      message: "Carousel data retrieved successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving carousel data by ID");
  }
});

app.patch("/carouseldata/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const carousel_collection = db.collection("carouseldata");
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const result = await carousel_collection.updateOne(
      { _id: new ObjectId(id) }, // Filter by ID
      { $set: req.body } // Update fields
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Carousel data not found" });
    }
    res.json({
      message: "Carousel data updated successfully",
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating carousel data");
  }
});

app.post("/about_text", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("about_text");

    // Insert data into the collection
    const result = await about_collection.insertOne(req.body);

    res.json({
      message: "about_text created successfully",
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating about_text");
  }
});

app.get("/about_text", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("about_text");

    // Retrieve all documents from the about_text collection
    const result = await about_collection.find({}).toArray();

    if (result.length === 0) {
      return res.status(404).json({ message: "No about text found" });
    }

    res.json({
      success: true,
      message: "About text retrieved successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving about_text");
  }
});

app.get("/about_text/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("about_text");

    const { id } = req.params;

    // Validate the provided ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find the document by ID
    const result = await about_collection.findOne({ _id: new ObjectId(id) });

    if (!result) {
      return res.status(404).json({ message: "About text not found" });
    }

    res.json({
      success: true,
      message: "About text retrieved successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving about_text by ID");
  }
});

app.patch("/about_text/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("about_text");

    const { id } = req.params;
    const updateData = req.body;

    // Validate the provided ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Attempt to update the document by ID
    const result = await about_collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // If no document was matched
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "About text not found" });
    }

    // If update is successful
    res.json({
      success: true,
      message: "About text updated successfully",
      data: updateData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating about_text by ID");
  }
});

app.delete("/about_text/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("about_text");

    const { id } = req.params;

    // Validate the provided ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Attempt to delete the document by ID
    const result = await about_collection.deleteOne({ _id: new ObjectId(id) });

    // If no document was found to delete
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "About text not found" });
    }

    // If deletion is successful
    res.json({
      success: true,
      message: "About text deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting about_text by ID");
  }
});

app.post("/basic_info", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("basic_info");

    // Optional: Validate the request body to ensure required fields are present
    if (!req.body.name || !req.body.description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    // Insert data into the collection
    const result = await about_collection.insertOne(req.body);

    res.json({
      message: "basic_info created successfully",
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating basic_info");
  }
});

app.patch("/basic_info/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("basic_info");

    const { id } = req.params;
    const updatedData = req.body;

    // Validate the provided ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Update the document with the provided ID
    const result = await about_collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData } // $set will update the existing fields with new data
    );

    // If no document was found to update
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "basic_info not found" });
    }

    // If the update is successful
    res.json({
      success: true,
      message: "basic_info updated successfully",
      updatedFields: updatedData, // Optionally return the updated fields
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating basic_info");
  }
});

app.get("/basic_info/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("basic_info");

    const { id } = req.params;

    // Validate the provided ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Fetch the document by its _id
    const result = await about_collection.findOne({ _id: new ObjectId(id) });

    // If no document was found with the provided ID
    if (!result) {
      return res.status(404).json({ message: "basic_info not found" });
    }

    // If the document is found, send it back in the response
    res.json({
      message: "basic_info retrieved successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving basic_info");
  }
});

app.get("/basic_info", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const about_collection = db.collection("basic_info");

    // Fetch all documents from the collection
    const results = await about_collection.find({}).toArray();

    // If no documents are found
    if (results.length === 0) {
      return res.status(404).json({ message: "No basic_info found" });
    }

    // If documents are found, send them back in the response
    res.json({
      message: "basic_info retrieved successfully",
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving basic_info");
  }
});

app.get("/", (req, res) => {
  res.send("API is working!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
