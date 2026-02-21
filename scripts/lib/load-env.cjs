/** Load .env from project root */
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
