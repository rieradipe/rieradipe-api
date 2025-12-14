import bcrypt from "bcrypt";

const password = process.argv[2];

if (!password) {
  console.log("Uso: node generateHash.js <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log("Hash generado:");
console.log(hash);
