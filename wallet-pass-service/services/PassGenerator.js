/**
 * Pass Generator Service
 * 
 * Core logic for generating Apple Wallet and Google Wallet passes.
 * Handles QR mode (functional) and NFC mode (placeholder).
 */

const { PKPass } = require('passkit-generator');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class PassGenerator {
  constructor() {
    // Apple Wallet configuration
    this.appleConfig = {
      passTypeId: process.env.APPLE_PASS_TYPE_ID || '',
      teamId: process.env.APPLE_TEAM_ID || '',
      certPath: process.env.APPLE_PASS_CERT_PATH || '',
      wwdrCertPath: process.env.APPLE_WWDR_CERT_PATH || ''
    };

    // Google Wallet configuration
    this.googleConfig = {
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '',
      serviceAccountPath: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT || ''
    };
  }

  /**
   * Generate Apple Wallet pass (.pkpass file)
   * @param {Object} params - Pass generation parameters
   * @returns {Promise<Buffer>} .pkpass file buffer
   */
  async generateApplePass(params) {
    const {
      wallet_id,
      balance_cents,
      mode = 'qr',
      qr_token,
      user_name = 'Orlando Pirates Fan'
    } = params;

    try {
      // Validate configuration
      if (!this.appleConfig.passTypeId || !this.appleConfig.teamId) {
        throw new Error('Apple Wallet configuration missing');
      }

      // Check if certificate files exist
      if (!fs.existsSync(this.appleConfig.certPath)) {
        throw new Error(`Apple certificate not found: ${this.appleConfig.certPath}`);
      }

      if (!fs.existsSync(this.appleConfig.wwdrCertPath)) {
        throw new Error(`Apple WWDR certificate not found: ${this.appleConfig.wwdrCertPath}`);
      }

      // Generate serial number
      const serialNumber = `OP-${wallet_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create pass instance
      const pass = await PKPass.from({
        model: path.join(__dirname, '../templates/apple'),
        certificates: {
          wwdr: this.appleConfig.wwdrCertPath,
          signerCert: this.appleConfig.certPath,
          signerKey: this.appleConfig.certPath, // Same file contains both cert and key
          signerKeyPassphrase: process.env.APPLE_CERT_PASSPHRASE || ''
        }
      }, {
        serialNumber,
        description: 'Orlando Pirates Digital Wallet',
        organizationName: 'Orlando Pirates',
        teamIdentifier: this.appleConfig.teamId,
        passTypeIdentifier: this.appleConfig.passTypeId,
        logoText: 'Orlando Pirates',
        backgroundColor: 'rgb(10, 30, 61)', // Navy
        foregroundColor: 'rgb(255, 255, 255)', // White
        labelColor: 'rgb(27, 155, 158)' // Teal
      });

      // Add store card fields
      pass.primaryFields.add({
        key: 'balance',
        label: 'Balance',
        value: `$${(balance_cents / 100).toFixed(2)}`
      });

      pass.secondaryFields.add({
        key: 'mode',
        label: 'Mode',
        value: mode.toUpperCase()
      });

      pass.auxiliaryFields.add({
        key: 'user',
        label: 'Account',
        value: user_name
      });

      // Add QR code for QR mode
      if (mode === 'qr' && qr_token) {
        pass.barcodes = [{
          message: qr_token,
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }];
      }

      // Add NFC placeholder for Phase 2
      if (mode === 'nfc') {
        // NFC will be added when Marqeta integration is complete
        pass.nfc = {
          message: 'NFC mode coming soon',
          encryptionPublicKey: null
        };
      }

      // Add metadata
      pass.serialNumber = serialNumber;
      pass.relevantDate = new Date().toISOString();

      // Generate .pkpass buffer
      const buffer = pass.getAsBuffer();

      return {
        buffer,
        serialNumber,
        passTypeId: this.appleConfig.passTypeId
      };

    } catch (error) {
      console.error('Error generating Apple pass:', error);
      throw new Error(`Failed to generate Apple pass: ${error.message}`);
    }
  }

  /**
   * Generate Google Wallet pass
   * @param {Object} params - Pass generation parameters
   * @returns {Promise<Object>} Pass object and save URL
   */
  async generateGooglePass(params) {
    const {
      wallet_id,
      balance_cents,
      mode = 'qr',
      qr_token,
      user_name = 'Orlando Pirates Fan'
    } = params;

    try {
      // Validate configuration
      if (!this.googleConfig.issuerId) {
        throw new Error('Google Wallet issuer ID missing');
      }

      if (!fs.existsSync(this.googleConfig.serviceAccountPath)) {
        throw new Error(`Google service account file not found: ${this.googleConfig.serviceAccountPath}`);
      }

      // Load Google service account
      const serviceAccount = JSON.parse(
        fs.readFileSync(this.googleConfig.serviceAccountPath, 'utf8')
      );

      // Initialize Google Wallet API
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
      });

      const client = await auth.getClient();
      const wallet = google.walletobjects({ version: 'v1', auth: client });

      // Generate pass ID
      const passId = `OP-${wallet_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const objectId = `${this.googleConfig.issuerId}.${passId}`;
      const classId = `${this.googleConfig.issuerId}.wallet`;

      // Create pass object
      const passObject = {
        id: objectId,
        classId: classId,
        state: 'active',
        genericObjects: [
          {
            id: `${objectId}.object`,
            classId: classId,
            state: 'active',
            cardTitle: {
              defaultValue: {
                language: 'en-US',
                value: 'Orlando Pirates Wallet'
              }
            },
            subheader: {
              defaultValue: {
                language: 'en-US',
                value: `Balance: $${(balance_cents / 100).toFixed(2)}`
              }
            },
            header: {
              defaultValue: {
                language: 'en-US',
                value: `${mode.toUpperCase()} Mode`
              }
            },
            textModulesData: [
              {
                header: 'Account',
                body: user_name
              },
              {
                header: 'Status',
                body: 'Active'
              }
            ]
          }
        ]
      };

      // Add QR code for QR mode
      if (mode === 'qr' && qr_token) {
        passObject.genericObjects[0].barcode = {
          type: 'QR_CODE',
          value: qr_token,
          alternateText: 'Scan to pay'
        };
      }

      // Add NFC placeholder for Phase 2
      if (mode === 'nfc') {
        // NFC will be added when Marqeta integration is complete
        passObject.genericObjects[0].nfcRepeatedField = {
          field: {
            fieldReference: {
              fieldPath: {
                field: 'nfc_token',
                message: 'NFC mode coming soon'
              }
            }
          }
        };
      }

      // Create or update pass class (if needed)
      try {
        await wallet.genericclass.insert({
          resource: {
            id: classId,
            classTemplateInfo: {
              cardTemplateOverride: {
                cardRowTemplateInfos: [
                  {
                    twoItems: {
                      startItem: {
                        firstValue: {
                          fields: [
                            {
                              fieldPath: 'object.textModulesData["Balance"]'
                            }
                          ]
                        }
                      },
                      endItem: {
                        firstValue: {
                          fields: [
                            {
                              fieldPath: 'object.textModulesData["Status"]'
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        });
      } catch (error) {
        // Class might already exist, that's okay
        if (!error.message.includes('already exists')) {
          console.warn('Error creating pass class:', error.message);
        }
      }

      // Create pass object
      const response = await wallet.genericobject.insert({
        resource: passObject
      });

      // Generate save URL
      const saveUrl = `https://pay.google.com/gp/v/save/${response.data.id}`;

      return {
        passId: objectId,
        saveUrl,
        passObject: response.data
      };

    } catch (error) {
      console.error('Error generating Google pass:', error);
      throw new Error(`Failed to generate Google pass: ${error.message}`);
    }
  }
}

module.exports = new PassGenerator();

