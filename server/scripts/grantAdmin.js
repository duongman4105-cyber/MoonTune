const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const getArgValue = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return '';
  return (process.argv[index + 1] || '').trim();
};

const email = getArgValue('--email');
const username = getArgValue('--username');

if (!email && !username) {
  console.error('Vui long truyen --email hoac --username.');
  console.error('Vi du: npm run grant-admin -- --email admin@example.com');
  process.exit(1);
}

const query = email ? { email } : { username };

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-soundcloud';
    await mongoose.connect(mongoUri);

    const user = await User.findOne(query);
    if (!user) {
      console.error('Khong tim thay tai khoan:', email || username);
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log('Tai khoan da co quyen admin:', user.email);
      process.exit(0);
    }

    user.isAdmin = true;
    await user.save();

    console.log('Cap quyen admin thanh cong cho:', user.email);
  } catch (error) {
    console.error('Loi cap quyen admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();
