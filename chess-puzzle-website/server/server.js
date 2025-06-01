const express = require('express');
const cors = require('cors');
const komodoApi = require('./komodoApi');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', komodoApi);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Komodo API server running on port ${PORT}`);
}); 