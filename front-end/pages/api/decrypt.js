// const openpgp = require('openpgp');
// const fs = require('fs');

// async function decryptMessage(encryptedText, privateKeyArmored, passphrase) {
//   // Read and decrypt the private key
//   const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });

//   const readyKey = privateKey.isDecrypted()
//   ? privateKey
//   : await openpgp.decryptKey({ privateKey, passphrase });

//   // Decrypt the message
//   const message = await openpgp.readMessage({
//     armoredMessage: encryptedText
//   });

//   const { data: decryptedText } = await openpgp.decrypt({
//     message,
//     decryptionKeys: readyKey
//   });

//   return decryptedText;
// }

// const encryptedText =  fs.readFileSync('../../encrypt.asc', 'utf8');

// const privateKeyArmored = fs.readFileSync('privateKey.asc', 'utf8');

// decryptMessage(encryptedText, privateKeyArmored, process.env.PASS_PHRASE)
//   .then(decryptedText => {
//     console.log('🔓 Decrypted message:');
//     console.log(decryptedText);
//   })
//   .catch(err => {
//     console.error('❌ Failed to decrypt:', err);
//   });