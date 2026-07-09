// Create DynamoDB tables for vendor management
// Run this script to set up the required AWS infrastructure

const AWS = require('aws-sdk');

// Configure AWS (make sure you have proper credentials)
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();

// Table definitions
const tables = [
  {
    TableName: 'ezdrink-vendors',
    KeySchema: [
      { AttributeName: 'customer_id', KeyType: 'HASH' }  // Partition key - from signup
    ],
    AttributeDefinitions: [
      { AttributeName: 'customer_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'merchantId-index',
        KeySchema: [
          { AttributeName: 'merchantId', KeyType: 'HASH' }  // GSI for Square merchant ID lookups
        ],
        AttributeDefinitions: [
          { AttributeName: 'merchantId', AttributeType: 'S' }
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
        AttributeDefinitions: [
          { AttributeName: 'status', AttributeType: 'S' },
          { AttributeName: 'lastUpdated', AttributeType: 'S' }
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
    },
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  }
];

async function createTables() {
  console.log('🚀 Creating DynamoDB tables...');
  
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
        console.error(`❌ Error creating table ${tableDefinition.TableName}:`, error.message);
      }
    }
  }
  
  console.log('🎉 All tables created successfully!');
}

// Run the script
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✅ Table creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
