const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/kilo-car-parking');
  
  // Get all vehicles
  const vehicles = await mongoose.connection.db.collection('vehicles').find({}).toArray();
  console.log('Found', vehicles.length, 'vehicles');
  
  // Fix each vehicle - ensure userId is properly stored as ObjectId
  for (const vehicle of vehicles) {
    const userIdStr = vehicle.userId.toString();
    // Convert string to ObjectId
    const objectId = new mongoose.Types.ObjectId(userIdStr);
    await mongoose.connection.db.collection('vehicles').updateOne(
      { _id: vehicle._id },
      { $set: { userId: objectId } }
    );
    console.log(`Fixed vehicle ${vehicle._id} userId to ${objectId}`);
  }
  
  console.log('\nAll vehicles fixed!');
  
  // Verify
  const fixed = await mongoose.connection.db.collection('vehicles').find({}).toArray();
  console.log('\nVerification:');
  fixed.forEach(v => {
    console.log(`  Vehicle ${v._id}: userId = ${v.userId} (type: ${typeof v.userId})`);
  });
  
  process.exit(0);
}

main().catch(console.error);
