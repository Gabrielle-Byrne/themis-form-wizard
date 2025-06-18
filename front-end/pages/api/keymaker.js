const openpgp = require('openpgp');
const fs = require('fs');


async function generatePGPKeyPair(name, email) {
    const { privateKey, publicKey } = await openpgp.generateKey({
    type: 'rsa', 
    rsaBits: 2048,
    userIDs: [{ name, email }],
    passphrase: process.env.PASS_PHRASE 
  });

    fs.writeFileSync('publicKey.asc', publicKey);
   // fs.writeFileSync('privateKey.asc', privateKey);
  return { publicKey, privateKey };
}

// Example usage
generatePGPKeyPair('UNB Legal Clinic', 'legalclinic@notanactualandlegitwebsite.com')
  .then(({ publicKey, privateKey }) => {
    console.log('--- PUBLIC KEY ---\n' + publicKey);
    console.log('--- PRIVATE KEY ---\n' + privateKey);
  });