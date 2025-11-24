const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

const dropIndex = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected.');

    console.log('Dropping index phone_1...');
    try {
      await mongoose.connection.collection('users').dropIndex('phone_1');
      console.log('Index phone_1 dropped successfully.');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('Index phone_1 not found (already dropped).');
      } else {
        throw err;
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

dropIndex();
