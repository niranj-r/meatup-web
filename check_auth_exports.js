const firebaseAuth = require('firebase/auth');
console.log('Firebase Auth Exports:', Object.keys(firebaseAuth));

try {
    const rnAuth = require('firebase/auth/react-native');
    console.log('Firebase Auth RN Exports:', Object.keys(rnAuth));
} catch (e) {
    console.log('firebase/auth/react-native not found');
}
