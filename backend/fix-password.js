const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/kilo-car-parking');
  
  const hash = bcrypt.hashSync('admin123', 10);
  console.log('New hash:', hash);
  
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@kilocar.com' },
    { $set: { password: hash } }
  );
  
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'admin@kilocar.com' });
  console.log('Updated user password:', user.password);
  
  const hash2 = bcrypt.hashSync('user123', 10);
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'user@example.com' },
    { $set: { password: hash2 } }
  );
  
  console.log('Passwords updated successfully!');
  process.exit(0);
}

main().catch(console.error);
