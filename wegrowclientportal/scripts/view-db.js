const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://Raj:iT3Wqx0axmZv1dHI@cluster0.86ttxfk.mongodb.net/wegrow_portal?appName=Cluster0';

console.log('Connecting to MongoDB Atlas...');
console.log('URI:', uri.replace(/:([^@]+)@/, ':****@'));

mongoose
  .connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    console.log('\n Connected to Database:', db.databaseName);

    const collections = await db.listCollections().toArray();
    console.log('\n--- COLLECTIONS SUMMARY ---');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(` • ${col.name.padEnd(20)}: ${count} documents`);
    }

    console.log('\n--- 1. USERS ---');
    const users = await db.collection('users').find().toArray();
    users.forEach((u) => {
      console.log(` • [${u.role.toUpperCase()}] ${u.email} (Name: ${u.name}, ClientId: ${u.clientId || 'N/A'})`);
    });

    console.log('\n--- 2. CLIENTS ---');
    const clients = await db.collection('clients').find().toArray();
    clients.forEach((c) => {
      console.log(` • [${c.clientId}] ${c.company} | Contact: ${c.contact} (${c.email})`);
    });

    console.log('\n--- 3. SESSIONS ---');
    const sessions = await db.collection('sessions').find().toArray();
    sessions.forEach((s) => {
      console.log(` • [${s.sessionId || s._id}] Client: ${s.clientId} | ${s.title} (${s.date} - ${s.status})`);
    });

    console.log('\n--- 4. ATTENDANCES (CHECK-INS) ---');
    const attendances = await db.collection('attendances').find().toArray();
    attendances.forEach((a) => {
      console.log(` • ${a.name} (${a.phone}) | Client: ${a.clientId} | Session: ${a.sessionId} | At: ${a.checkedInAt}`);
    });

    console.log('\n--- 5. FEEDBACKS ---');
    const feedbacks = await db.collection('sessionfeedbacks').find().toArray();
    feedbacks.forEach((f) => {
      console.log(` • [${f.rating}★] Session: ${f.session} | Client: ${f.clientId} | "${f.comments || 'No comment'}"`);
    });

    console.log('\nTo view in a GUI, open MongoDB Compass and connect to:');
    console.log(uri);
    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });
