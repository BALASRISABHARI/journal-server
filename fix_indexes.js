const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;

console.log('Connecting to fix indexes...');

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to DB');
        try {
            const collection = mongoose.connection.collection('users');
            // List indexes to be sure
            const indexes = await collection.indexes();
            console.log('Current indexes:', indexes);

            // Drop the problematic username index
            if (indexes.find(i => i.name === 'username_1')) {
                await collection.dropIndex('username_1');
                console.log('✅ Successfully dropped "username_1" index.');
            } else {
                console.log('ℹ️ "username_1" index not found.');
            }

        } catch (error) {
            console.error('Error handling indexes:', error.message);
        } finally {
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('Connection Failed:', err);
        process.exit(1);
    });
