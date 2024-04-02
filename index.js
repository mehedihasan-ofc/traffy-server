const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// =======================================================>
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d9zindd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        await client.connect();

        const categoriesCollection = client.db('traffyDB').collection('categories');
        const servicesCollection = client.db('traffyDB').collection('services');
        const adsCollection = client.db('traffyDB').collection('ads');
        const faqCollection = client.db('traffyDB').collection('faq');

        app.get('/categories', async (req, res) => {
            const result = await categoriesCollection.find().toArray();
            res.send(result);
        });

        app.get('/services', async (req, res) => {
            try {
                const services = await servicesCollection.find().toArray();
                const categories = await categoriesCollection.find().toArray();

                // Map category ids to category names for faster lookup
                const categoryMap = {};
                categories.forEach(category => {
                    categoryMap[category._id.toString()] = category.title;
                });

                // Group services by category
                const servicesByCategory = {};
                services.forEach(service => {
                    const categoryId = service.categoryId;
                    const categoryName = categoryMap[categoryId];
                    if (!servicesByCategory[categoryId]) {
                        servicesByCategory[categoryId] = {
                            id: categoryId,
                            categoryName: categoryName,
                            services: []
                        };
                    }
                    servicesByCategory[categoryId].services.push(service);
                });

                // Convert servicesByCategory object to an array of objects
                const result = Object.values(servicesByCategory);

                res.send(result);
            } catch (error) {
                console.error("Error fetching services:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.get('/ads', async (req, res) => {
            const result = await adsCollection.find().toArray();
            res.send(result);
        });

        app.get('/faq', async (req, res) => {
            const result = await faqCollection.find().toArray();
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
// =======================================================>

app.get('/', (req, res) => {
    res.send('Traffy is running!')
})

app.listen(port, () => {
    console.log(`Traffy is running on port ${port}`);
})