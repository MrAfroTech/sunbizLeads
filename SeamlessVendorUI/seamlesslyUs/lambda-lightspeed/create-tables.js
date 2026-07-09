// Create DynamoDB tables for Lightspeed vendor management
// Run this script to set up the required AWS infrastructure

const AWS = require('aws-sdk');

// Configure AWS (make sure you have proper credentials)
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();

// Table definitions - same structure as Square for consistency
const tables = [
  {
    TableName: 'ezdrink-vendors',
    KeySchema: [
      { AttributeName: 'customer_id', KeyType: 'HASH' }  // Partition key - from signup
    ],
    AttributeDefinitions: [
      { AttributeName: 'customer_id', AttributeType: 'S' },
      { AttributeName: 'merchantId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'lastUpdated', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'merchantId-index',
        KeySchema: [
          { AttributeName: 'merchantId', KeyType: 'HASH' }  // GSI for Lightspeed merchant ID lookups
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'lastUpdated', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ]
  },
  {
    TableName: 'seamless-lightspeed-tokens',
    KeySchema: [
      { AttributeName: 'merchantId', KeyType: 'HASH' }  // Partition key - Lightspeed merchant ID
    ],
    AttributeDefinitions: [
      { AttributeName: 'merchantId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'ezdrink-websocket-connections',
    KeySchema: [
      { AttributeName: 'connectionId', KeyType: 'HASH' }  // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'connectionId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }
];

async function createTables() {
  console.log('🚀 Creating DynamoDB tables for Lightspeed integration...');
  
  for (const tableDefinition of tables) {
    try {
      console.log(`Creating table: ${tableDefinition.TableName}`);
      
      await dynamodb.createTable(tableDefinition).promise();
      
      console.log(`✅ Table ${tableDefinition.TableName} created successfully`);
      
      // Wait for table to be active
      console.log(`⏳ Waiting for table ${tableDefinition.TableName} to be active...`);
      await dynamodb.waitFor('tableExists', { TableName: tableDefinition.TableName }).promise();
      console.log(`✅ Table ${tableDefinition.TableName} is now active`);
      
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`ℹ️  Table ${tableDefinition.TableName} already exists`);
      } else {
        console.error(`❌ Failed to create table ${tableDefinition.TableName}:`, error);
        throw error;
      }
    }
  }
  
  console.log('🎉 All DynamoDB tables created successfully!');
}

// Run the table creation
createTables().catch(console.error);
