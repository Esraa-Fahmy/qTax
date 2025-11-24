const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });
const DriverProfile = require('./models/driverProfileModel');

const fixUrls = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected.');

    const profiles = await DriverProfile.find({});
    console.log(`Found ${profiles.length} profiles.`);

    for (const profile of profiles) {
      let changed = false;
      const fields = [
        'licenseFront', 'licenseBack', 
        'carRegFront', 'carRegBack', 
        'nationalIdFront', 'nationalIdBack'
      ];

      fields.forEach(field => {
        if (profile[field] && profile[field].includes('/uploads/drivers/')) {
          const oldVal = profile[field];
          profile[field] = profile[field].split('/uploads/drivers/').pop();
          if (oldVal !== profile[field]) changed = true;
        }
      });

      if (profile.carPhotos && profile.carPhotos.length > 0) {
        const newPhotos = profile.carPhotos.map(photo => {
          if (photo && photo.includes('/uploads/drivers/')) {
            changed = true;
            return photo.split('/uploads/drivers/').pop();
          }
          return photo;
        });
        profile.carPhotos = newPhotos;
      }

      if (changed) {
        await profile.save();
        console.log(`Updated profile for user: ${profile.user}`);
      }
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

fixUrls();
