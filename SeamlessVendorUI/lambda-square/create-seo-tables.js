#!/usr/bin/env node

/**
 * Create DynamoDB tables for SEO and location-based content management
 * Based on CTO SEO Guidelines and DynamoDB Integration Specifications
 */

const AWS = require('aws-sdk');

// Configure AWS (make sure you have proper credentials)
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();

// SEO and Location Management Tables
const seoTables = [
  {
    TableName: 'seamless-locations',
    KeySchema: [
      { AttributeName: 'location_id', KeyType: 'HASH' },      // Partition key - city slug
      { AttributeName: 'content_type', KeyType: 'RANGE' }     // Sort key - meta_data, schema, content, form_config
    ],
    AttributeDefinitions: [
      { AttributeName: 'location_id', AttributeType: 'S' },
      { AttributeName: 'content_type', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'priority-index',
        KeySchema: [
          { AttributeName: 'priority', KeyType: 'HASH' },
          { AttributeName: 'city_name', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'priority', AttributeType: 'N' },
          { AttributeName: 'city_name', AttributeType: 'S' }
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
    TableName: 'seamless-schema-data',
    KeySchema: [
      { AttributeName: 'location_id', KeyType: 'HASH' },      // Partition key - city slug
      { AttributeName: 'schema_type', KeyType: 'RANGE' }      // Sort key - LocalBusiness, Service, etc.
    ],
    AttributeDefinitions: [
      { AttributeName: 'location_id', AttributeType: 'S' },
      { AttributeName: 'schema_type', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'seamless-form-configs',
    KeySchema: [
      { AttributeName: 'location_id', KeyType: 'HASH' }       // Partition key - city slug
    ],
    AttributeDefinitions: [
      { AttributeName: 'location_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }
];

async function createSeoTables() {
  console.log('🚀 Creating SEO and Location Management DynamoDB tables...');
  
  for (const table of seoTables) {
    try {
      console.log(`📋 Creating table: ${table.TableName}`);
      
      // Check if table already exists
      try {
        await dynamodb.describeTable({ TableName: table.TableName }).promise();
        console.log(`✅ Table ${table.TableName} already exists, skipping...`);
        continue;
      } catch (error) {
        if (error.code !== 'ResourceNotFoundException') {
          throw error;
        }
        // Table doesn't exist, proceed with creation
      }
      
      const params = {
        TableName: table.TableName,
        KeySchema: table.KeySchema,
        AttributeDefinitions: table.AttributeDefinitions,
        ProvisionedThroughput: table.ProvisionedThroughput
      };
      
      // Add GSI if present
      if (table.GlobalSecondaryIndexes) {
        params.GlobalSecondaryIndexes = table.GlobalSecondaryIndexes;
      }
      
      const result = await dynamodb.createTable(params).promise();
      console.log(`✅ Table ${table.TableName} created successfully`);
      console.log(`   Table ARN: ${result.TableDescription.TableArn}`);
      
      // Wait for table to be active
      console.log(`⏳ Waiting for table ${table.TableName} to become active...`);
      await dynamodb.waitFor('tableExists', { TableName: table.TableName }).promise();
      console.log(`✅ Table ${table.TableName} is now active`);
      
    } catch (error) {
      console.error(`❌ Error creating table ${table.TableName}:`, error.message);
      throw error;
    }
  }
  
  console.log('🎉 All SEO tables created successfully!');
}

// Seed initial location data
async function seedLocationData() {
  console.log('🌱 Seeding initial location data...');
  
  const docClient = new AWS.DynamoDB.DocumentClient();
  
  // Major Markets (Priority 0.9)
  const majorMarkets = [
    {
      location_id: 'orlando',
      content_type: 'meta_data',
      city_name: 'Orlando',
      state: 'Florida',
      title_tag: 'Skip the Line Orlando - QR Code Ordering for Restaurants & Bars | Seamless',
      meta_description: 'Eliminate wait times at Orlando restaurants, bars, and entertainment venues. Seamless integrates with any POS system - from International Drive to downtown Orlando. Get demo for your Orlando business.',
      h1_headline: 'Increase Your Orlando Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'International Drive',
      local_area_2: 'downtown Orlando',
      venue_types: ['restaurant', 'bar', 'entertainment'],
      priority: 0.9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      location_id: 'tampa',
      content_type: 'meta_data',
      city_name: 'Tampa',
      state: 'Florida',
      title_tag: 'Tampa Restaurant Technology - Mobile Ordering System | Seamless',
      meta_description: 'Eliminate wait times at Tampa restaurants, bars, and entertainment venues. Seamless integrates with any POS system - from Ybor City to downtown Tampa. Get demo for your Tampa business.',
      h1_headline: 'Increase Your Tampa Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'Ybor City',
      local_area_2: 'downtown Tampa',
      venue_types: ['restaurant', 'bar', 'entertainment'],
      priority: 0.9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  // High-Priority Micro Downtowns (Priority 0.8)
  const microDowntowns = [
    {
      location_id: 'winter-garden',
      content_type: 'meta_data',
      city_name: 'Winter Garden',
      state: 'Florida',
      title_tag: 'Winter Garden Restaurant Technology - Mobile Ordering System | Seamless',
      meta_description: 'Skip the line at Winter Garden restaurants and cafes. Seamless QR ordering integrates with any POS - from Plant Street Market to downtown. Get demo for your Winter Garden venue.',
      h1_headline: 'Increase Your Winter Garden Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'Plant Street Market',
      local_area_2: 'downtown Winter Garden',
      venue_types: ['restaurant', 'cafe', 'local_business'],
      priority: 0.8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      location_id: 'clermont',
      content_type: 'meta_data',
      city_name: 'Clermont',
      state: 'Florida',
      title_tag: 'Clermont Food Ordering - Eliminate Wait Times at Local Venues | Seamless',
      meta_description: 'Eliminate lines at Clermont restaurants and local venues. Seamless ordering integrates with any POS system throughout downtown Clermont. Schedule demo for your business.',
      h1_headline: 'Increase Your Clermont Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'downtown Clermont',
      local_area_2: 'Clermont Station',
      venue_types: ['restaurant', 'cafe', 'local_business'],
      priority: 0.8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      location_id: 'winter-park',
      content_type: 'meta_data',
      city_name: 'Winter Park',
      state: 'Florida',
      title_tag: 'Winter Park Dining Technology - Contactless Ordering Solution | Seamless',
      meta_description: 'Reduce wait times at Winter Park dining establishments. Seamless mobile ordering works with any POS system - from Park Avenue to downtown. Demo available for Winter Park restaurants.',
      h1_headline: 'Increase Your Winter Park Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'Park Avenue',
      local_area_2: 'downtown Winter Park',
      venue_types: ['restaurant', 'cafe', 'upscale_dining'],
      priority: 0.8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      location_id: 'maitland',
      content_type: 'meta_data',
      city_name: 'Maitland',
      state: 'Florida',
      title_tag: 'Maitland Restaurant POS Integration - Skip the Line Technology | Seamless',
      meta_description: 'Skip the line at Maitland restaurants and local venues. Seamless QR ordering integrates with any POS system throughout Maitland. Get demo for your business.',
      h1_headline: 'Increase Your Maitland Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'downtown Maitland',
      local_area_2: 'Maitland Center',
      venue_types: ['restaurant', 'cafe', 'local_business'],
      priority: 0.8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  // Remaining Micro Downtowns (Priority 0.7)
  const remainingDowntowns = [
    {
      location_id: 'apopka',
      content_type: 'meta_data',
      city_name: 'Apopka',
      state: 'Florida',
      title_tag: 'Apopka Mobile Ordering - QR Code System for Restaurants | Seamless',
      meta_description: 'Skip the line at Apopka restaurants and local venues. Seamless QR ordering integrates with any POS system throughout downtown Apopka. Get demo for your business.',
      h1_headline: 'Increase Your Apopka Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'downtown Apopka',
      local_area_2: 'Apopka Station',
      venue_types: ['restaurant', 'cafe', 'local_business'],
      priority: 0.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      location_id: 'mount-dora',
      content_type: 'meta_data',
      city_name: 'Mount Dora',
      state: 'Florida',
      title_tag: 'Mount Dora Restaurant Innovation - Mobile Ordering Platform | Seamless',
      meta_description: 'Skip the line at Mount Dora restaurants and local venues. Seamless QR ordering integrates with any POS system throughout downtown Mount Dora. Get demo for your business.',
      h1_headline: 'Increase Your Mount Dora Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'downtown Mount Dora',
      local_area_2: 'Mount Dora Marina',
      venue_types: ['restaurant', 'cafe', 'local_business'],
      priority: 0.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      location_id: 'sanford',
      content_type: 'meta_data',
      city_name: 'Sanford',
      state: 'Florida',
      title_tag: 'Sanford Food Service Technology - QR Ordering for Local Venues | Seamless',
      meta_description: 'Skip the line at Sanford restaurants and local venues. Seamless QR ordering integrates with any POS system throughout downtown Sanford. Get demo for your business.',
      h1_headline: 'Increase Your Sanford Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'downtown Sanford',
      local_area_2: 'Sanford Marina',
      venue_types: ['restaurant', 'cafe', 'local_business'],
      priority: 0.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  // County Pages (Priority 0.6)
  const countyPages = [
    {
      location_id: 'lake-county',
      content_type: 'meta_data',
      city_name: 'Lake County',
      state: 'Florida',
      title_tag: 'Lake County Restaurant Ordering - POS Integration Service | Seamless',
      meta_description: 'Lake County restaurant ordering system. Seamless integrates with any POS system throughout Lake County - from Clermont to Mount Dora. Get demo for your business.',
      h1_headline: 'Increase Your Lake County Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'Clermont',
      local_area_2: 'Mount Dora',
      venue_types: ['restaurant', 'bar', 'local_business'],
      priority: 0.6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      location_id: 'polk-county',
      content_type: 'meta_data',
      city_name: 'Polk County',
      state: 'Florida',
      title_tag: 'Polk County Restaurant Ordering - POS Integration Service | Seamless',
      meta_description: 'Polk County restaurant ordering system. Seamless integrates with any POS system throughout Polk County - from Lakeland to Winter Haven. Get demo for your business.',
      h1_headline: 'Increase Your Polk County Restaurant Revenue - Reduce Wait Times by 60%',
      local_area_1: 'Lakeland',
      local_area_2: 'Winter Haven',
      venue_types: ['restaurant', 'bar', 'local_business'],
      priority: 0.6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  const allLocations = [...majorMarkets, ...microDowntowns, ...remainingDowntowns, ...countyPages];
  
  for (const location of allLocations) {
    try {
      await docClient.put({
        TableName: 'seamless-locations',
        Item: location
      }).promise();
      console.log(`✅ Seeded location data for ${location.city_name}`);
    } catch (error) {
      console.error(`❌ Error seeding ${location.city_name}:`, error.message);
    }
  }
  
  console.log('🎉 Location data seeding completed!');
}

// Main execution
async function main() {
  try {
    await createSeoTables();
    await seedLocationData();
    console.log('🚀 SEO table setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createSeoTables, seedLocationData };
