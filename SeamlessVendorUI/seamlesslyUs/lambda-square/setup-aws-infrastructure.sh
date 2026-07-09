#!/bin/bash

# AWS Infrastructure Setup Script for EzDrink Vendor Management
# This script creates the necessary AWS resources for the vendor-to-customer bridge

set -e

echo "🚀 Setting up AWS infrastructure for EzDrink Vendor Management..."

# Configuration
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="ezdrink-vendor-management"
LAMBDA_BUCKET="ezdrink-lambda-deployments"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS credentials verified. Proceeding with infrastructure setup..."

# Create S3 bucket for Lambda deployments if it doesn't exist
print_status "Creating S3 bucket for Lambda deployments..."
if aws s3 ls "s3://$LAMBDA_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$LAMBDA_BUCKET" --region $REGION
    print_status "S3 bucket created: $LAMBDA_BUCKET"
else
    print_warning "S3 bucket already exists: $LAMBDA_BUCKET"
fi

# Create DynamoDB tables
print_status "Creating DynamoDB tables..."
node create-tables.js

# Create CloudFormation stack for API Gateway and Lambda functions
print_status "Creating CloudFormation stack..."

# Create the CloudFormation template
cat > cloudformation-template.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'EzDrink Vendor Management Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]
    Description: Environment name

Resources:
  # Vendor Management Lambda Function
  VendorManagementFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'ezdrink-vendor-management-${Environment}'
      Runtime: nodejs18.x
      Handler: vendor-management-handler.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return { statusCode: 200, body: 'Placeholder' };
          };
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          VENDORS_TABLE: !Ref VendorsTable
          WEBSOCKET_ENDPOINT: !Sub '${WebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
      Timeout: 30
      MemorySize: 256

  # WebSocket Handler Lambda Function
  WebSocketHandlerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'ezdrink-websocket-handler-${Environment}'
      Runtime: nodejs18.x
      Handler: websocket-handler.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return { statusCode: 200, body: 'Placeholder' };
          };
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          CONNECTIONS_TABLE: !Ref WebSocketConnectionsTable
          WEBSOCKET_ENDPOINT: !Sub '${WebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
      Timeout: 30
      MemorySize: 256

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Scan
                  - dynamodb:Query
                Resource:
                  - !GetAtt VendorsTable.Arn
                  - !GetAtt WebSocketConnectionsTable.Arn
        - PolicyName: WebSocketAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - execute-api:ManageConnections
                Resource: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::Account}:${WebSocketApi}/*'

  # DynamoDB Tables
  VendorsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'ezdrink-vendors-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: merchantId
          AttributeType: S
      KeySchema:
        - AttributeName: merchantId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: status-index
          KeySchema:
            - AttributeName: status
              KeyType: HASH
            - AttributeName: createdAt
              KeyType: RANGE
          AttributeDefinitions:
            - AttributeName: status
              AttributeType: S
            - AttributeName: createdAt
              AttributeType: S
          Projection:
            ProjectionType: ALL

  WebSocketConnectionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'ezdrink-websocket-connections-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: connectionId
          AttributeType: S
      KeySchema:
        - AttributeName: connectionId
          KeyType: HASH
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true

  # WebSocket API Gateway
  WebSocketApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub 'ezdrink-websocket-${Environment}'
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: '$request.body.action

  # WebSocket Routes
  WebSocketConnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $connect
      AuthorizationType: NONE
      Target: !Sub 'integrations/${WebSocketConnectIntegration}'

  WebSocketDisconnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $disconnect
      AuthorizationType: NONE
      Target: !Sub 'integrations/${WebSocketDisconnectIntegration}'

  WebSocketDefaultRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $default
      AuthorizationType: NONE
      Target: !Sub 'integrations/${WebSocketDefaultIntegration}'

  # WebSocket Integrations
  WebSocketConnectIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${WebSocketHandlerFunction.Arn}/invocations'

  WebSocketDisconnectIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${WebSocketHandlerFunction.Arn}/invocations'

  WebSocketDefaultIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${WebSocketHandlerFunction.Arn}/invocations'

  # WebSocket Stage
  WebSocketStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref WebSocketApi
      StageName: !Ref Environment
      AutoDeploy: true

  # REST API Gateway for Vendor Management
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'ezdrink-vendor-api-${Environment}'
      Description: 'EzDrink Vendor Management API'

  # REST API Resources and Methods
  VendorsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: vendors

  VendorsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref VendorsResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${VendorManagementFunction.Arn}/invocations'

  VendorStatusResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !Ref VendorsResource
      PathPart: status

  VendorStatusMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref VendorStatusResource
      HttpMethod: PUT
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${VendorManagementFunction.Arn}/invocations'

  ActiveVendorsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !Ref VendorsResource
      PathPart: active

  ActiveVendorsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ActiveVendorsResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${VendorManagementFunction.Arn}/invocations'

  # Lambda permissions for API Gateway
  VendorManagementPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref VendorManagementFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::Account}:${RestApi}/*'

  WebSocketHandlerPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref WebSocketHandlerFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::Account}:${WebSocketApi}/*'

Outputs:
  VendorManagementFunctionArn:
    Description: 'Vendor Management Lambda Function ARN'
    Value: !GetAtt VendorManagementFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-VendorManagementFunctionArn'

  WebSocketHandlerFunctionArn:
    Description: 'WebSocket Handler Lambda Function ARN'
    Value: !GetAtt WebSocketHandlerFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebSocketHandlerFunctionArn'

  WebSocketApiEndpoint:
    Description: 'WebSocket API Endpoint'
    Value: !Sub 'wss://${WebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-WebSocketApiEndpoint'

  RestApiEndpoint:
    Description: 'REST API Endpoint'
    Value: !Sub 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-RestApiEndpoint'

  VendorsTableName:
    Description: 'Vendors DynamoDB Table Name'
    Value: !Ref VendorsTable
    Export:
      Name: !Sub '${AWS::StackName}-VendorsTableName'

  WebSocketConnectionsTableName:
    Description: 'WebSocket Connections DynamoDB Table Name'
    Value: !Ref WebSocketConnectionsTable
    Export:
      Name: !Sub '${AWS::StackName}-WebSocketConnectionsTableName'
EOF

# Deploy the CloudFormation stack
print_status "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_IAM \
  --region $REGION

# Wait for stack to complete
print_status "Waiting for stack deployment to complete..."
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $REGION

# Get stack outputs
print_status "Getting stack outputs..."
STACK_OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs' \
  --output json)

# Extract important values
WEB_SOCKET_ENDPOINT=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="WebSocketApiEndpoint") | .OutputValue')
REST_API_ENDPOINT=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="RestApiEndpoint") | .OutputValue')
VENDORS_TABLE=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="VendorsTableName") | .OutputValue')

print_status "Stack deployment completed successfully!"
echo ""
echo "📋 Stack Outputs:"
echo "  WebSocket Endpoint: $WEB_SOCKET_ENDPOINT"
echo "  REST API Endpoint: $REST_API_ENDPOINT"
echo "  Vendors Table: $VENDORS_TABLE"
echo ""

# Create environment file for the frontend
print_status "Creating environment configuration file..."
cat > .env.aws << EOF
# AWS Infrastructure Configuration
REACT_APP_VENDOR_LAMBDA_URL=$REST_API_ENDPOINT
REACT_APP_WEBSOCKET_ENDPOINT=$WEB_SOCKET_ENDPOINT
REACT_APP_VENDORS_TABLE=$VENDORS_TABLE
EOF

print_status "Environment configuration saved to .env.aws"
print_status "Copy these values to your .env file or set them as environment variables"

echo ""
print_status "🎉 AWS infrastructure setup completed!"
print_status "Next steps:"
echo "  1. Copy the environment variables to your .env file"
echo "  2. Deploy your Lambda functions with the actual code"
echo "  3. Test the vendor registration flow"
echo ""
print_warning "Note: The Lambda functions currently contain placeholder code."
print_warning "You'll need to deploy the actual vendor-management-handler.js and websocket-handler.js files."
