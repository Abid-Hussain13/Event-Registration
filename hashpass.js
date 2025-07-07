import bcrypt from 'bcryptjs';

const plainPassword = 'admin123'; // use the admin password you used in phpMyAdmin

bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});
