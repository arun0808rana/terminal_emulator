const express = require('express');
const app = express();

app.get('/', (req, res) => {
  // This is a blocking operation that takes 5 seconds to complete
  const startTime = Date.now();
  while (Date.now() - startTime < 5000) {}

  res.send('Hello, World!');
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
