console.log("Checking process.env for EMAIL_USER and EMAIL_PASS:");
console.log("EMAIL_USER exists:", !!process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
console.log("EMAIL_USER value length:", process.env.EMAIL_USER ? process.env.EMAIL_USER.length : 0);
