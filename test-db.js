const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://icekung8448_db_user:KwJ9nq1q5SjBSiV3@webprofile.u1sm17a.mongodb.net/?retryWrites=true&w=majority&appName=Webprofile";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 8000
});

async function run() {
  try {
    console.log("Connecting to MongoDB Atlas with custom DNS...");
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("SUCCESS: Pinged deployment. You successfully connected to MongoDB!");
    
    const db = client.db("webprofile_db");
    const collections = await db.listCollections().toArray();
    console.log("Existing collections in webprofile_db:", collections.map(c => c.name));
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.close();
  }
}
run();
