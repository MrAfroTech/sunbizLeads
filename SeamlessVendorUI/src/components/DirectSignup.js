import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import '../styles/DirectSignup.css';

const DirectSignupForm = ({ stripeEnvironment }) => {
    const elements = useElements();
    const stripe = useStripe();
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        businessName: '',
        vendorType: '',
        cuisineType: '',
        email: '',
        phone: '',
        posSystem: '',
        selectedPlan: ''
    });

    // Helper function to create form data for Lambda function
    const createFormData = () => ({
        businessName: formData.businessName,
        vendorType: formData.vendorType,
        cuisineType: formData.cuisineType,
        email: formData.email,
        phone: `+1${formData.phone.replace(/\D/g, '').padStart(10, '0')}`, // Send in E.164 format (+1XXXXXXXXXX)
        posSystem: formData.posSystem,
        selectedPlan: formData.selectedPlan
    });

    useEffect(() => {
        // Set page title
        document.title = "Seamless | Views, Vendors, Venues & Vibes";
        
        // Handle URL parameters for pre-selecting plan
        const urlParams = new URLSearchParams(window.location.search);
        const planParam = urlParams.get('plan');
        if (planParam && ['free', 'pro', 'ultimate'].includes(planParam)) {
            setSelectedPlan(planParam);
            setFormData(prev => ({ ...prev, selectedPlan: planParam }));
        }
    }, []);

    const plans = [
        {
            id: 'free',
            name: 'Forever Free',
            price: '$0',
            period: '/month',
            features: [
                'Basic vendor profile',
                'QR code generation',
                'Basic analytics',
                'Email support'
            ],
            description: 'Perfect for getting started',
            color: '#10b981'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$39.99',
            period: '/month',
            features: [
                'Everything in Free',
                'Advanced analytics',
                'Priority support',
                'Custom branding',
                'Multiple locations'
            ],
            description: 'Most popular choice',
            featured: true,
            color: '#3b82f6'
        },
        {
            id: 'ultimate',
            name: 'Ultimate',
            price: '$79.99',
            period: '/month',
            features: [
                'Everything in Pro',
                'White-label solution',
                'API access',
                'Dedicated account manager',
                'Custom integrations'
            ],
            description: 'For enterprise needs',
            color: '#8b5cf6'
        }
    ];

    const handlePlanChange = (e) => {
        const plan = e.target.value;
        setSelectedPlan(plan);
        setFormData(prev => ({ ...prev, selectedPlan: plan }));
        
        // Show/hide credit card section based on plan
        const creditCardSection = document.getElementById('credit-card-section');
        if (creditCardSection) {
            if (plan === 'pro' || plan === 'ultimate') {
                creditCardSection.style.display = 'block';
            } else {
                creditCardSection.style.display = 'none';
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`🔄 Input change - ${name}:`, value);
        
        // Special handling for phone number formatting
        if (name === 'phone') {
            // Remove all non-numeric characters
            const numericOnly = value.replace(/\D/g, '');
            
            // Format as (XXX) XXX-XXXX for display
            let formatted = '';
            if (numericOnly.length >= 1) formatted += `(${numericOnly.slice(0, 3)}`;
            if (numericOnly.length >= 4) formatted += `) ${numericOnly.slice(3, 6)}`;
            if (numericOnly.length >= 7) formatted += `-${numericOnly.slice(6, 10)}`;
            
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Show/hide cuisine type based on vendor type
        if (name === 'vendorType') {
            const cuisineTypeSection = document.getElementById('cuisine-type-section');
            if (value === 'food-truck') {
                cuisineTypeSection.style.display = 'block';
            } else {
                cuisineTypeSection.style.display = 'none';
                // Clear cuisine type when vendor type changes
                setFormData(prev => ({ ...prev, cuisineType: '' }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🚀 [DEBUG] Form submission started');
        console.log('📋 [DEBUG] Form data:', formData);
        console.log('🔍 [DEBUG] POS System selected:', formData.posSystem);
        console.log('🔍 [DEBUG] POS System type:', typeof formData.posSystem);
        
        // NEW: Debug environment variables
        console.log('🔧 [DEBUG] Environment variables:');
        console.log('🔧 [DEBUG] REACT_APP_LAMBDA_FUNCTION_URL:', process.env.REACT_APP_LAMBDA_FUNCTION_URL);
        console.log('🔧 [DEBUG] NODE_ENV:', process.env.NODE_ENV);
        
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('✅ [DEBUG] Form validation started');
            
            // Validate form
            if (!formData.businessName || !formData.email || 
                !formData.phone || !formData.selectedPlan) {
                console.log('❌ [DEBUG] Form validation failed');
                throw new Error('Please fill in all required fields');
            }

            // Validate phone number format (must be at least 10 digits)
            const phoneDigits = formData.phone.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                console.log('❌ [DEBUG] Phone number validation failed');
                throw new Error('Please enter a valid 10-digit phone number');
            }

            // Validate POS system selection for all plans
            if (!formData.posSystem) {
                console.log('❌ [DEBUG] POS System validation failed');
                throw new Error('Please select your POS system');
            }

            console.log('✅ [DEBUG] Form validation passed');
            
            // NEW: Debug form data being sent to Lambda
            const formDataForLambda = createFormData();
            console.log('📤 [DEBUG] Data being sent to Lambda:', formDataForLambda);
            console.log('📤 [DEBUG] Lambda function URL:', process.env.REACT_APP_LAMBDA_FUNCTION_URL || 'YOUR_LAMBDA_FUNCTION_URL_HERE');
            
            // For paid plans, validate payment fields
            if (formData.selectedPlan === 'pro' || formData.selectedPlan === 'ultimate') {
                console.log('💳 [DEBUG] Validating payment fields for paid plan');
                const nameOnCard = document.getElementById('name-on-card')?.value;

                console.log('💳 [DEBUG] Payment field values:', { nameOnCard: !!nameOnCard });

                if (!nameOnCard) {
                    console.log('❌ [DEBUG] Payment validation failed');
                    throw new Error('Please fill in all payment information');
                }
                console.log('✅ [DEBUG] Payment validation passed');
            } else {
                console.log('🆓 [DEBUG] Free plan - skipping payment validation');
            }

            // For paid plans, process payment first
            if (formData.selectedPlan === 'pro' || formData.selectedPlan === 'ultimate') {
                if (!stripe) {
                    throw new Error('Payment system not loaded');
                }

                // Check if name on card field exists
                const nameOnCard = document.getElementById('name-on-card');

                if (!nameOnCard) {
                    throw new Error('Payment form not properly loaded');
                }

                // Create payment method using Stripe Elements
                const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: elements.getElement(CardElement), // Use Stripe Element
                    billing_details: {
                        name: nameOnCard.value,
                        email: formData.email,
                    },
                });

                if (paymentMethodError) {
                    throw new Error(paymentMethodError.message);
                }

                // Payment successful - show success and add to Klaviyo
                setSuccess('Payment processed successfully! Adding you to our vendor database...');
                
                // Add vendor to database via Lambda function (PAID PLAN)
                try {
                    console.log('📧 Adding vendor to database via Lambda function...');
                    
                    const formDataForLambda = createFormData();
                    console.log('🔍 [DEBUG] Data being sent to Lambda:', formDataForLambda);
                    console.log('🔍 [DEBUG] Lambda function URL:', process.env.REACT_APP_LAMBDA_FUNCTION_URL || 'YOUR_LAMBDA_FUNCTION_URL_HERE');
                    
                    const response = await fetch(process.env.REACT_APP_LAMBDA_FUNCTION_URL || 'YOUR_LAMBDA_FUNCTION_URL_HERE', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formDataForLambda)
                    });
                    
                    console.log('🔍 [DEBUG] Response status:', response.status);
                    console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('✅ Lambda function response:', result);
                        console.log('🔍 [DEBUG] Response data type:', typeof result);
                        console.log('🔍 [DEBUG] Response keys:', Object.keys(result));
                        
                        // Now invoke the customer bridge lambda DIRECTLY to store the vendor data
                        const customerBridgeLambdaUrl = process.env.REACT_APP_CUSTOMER_BRIDGE_LAMBDA_URL || 'https://e6v7rbwuqctzlkkcqtsxd4tgdy0iaogt.lambda-url.us-east-1.on.aws';
                        let customer_id = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        
                        if (customerBridgeLambdaUrl) {
                            try {
                                console.log('🔗 Invoking customer bridge lambda DIRECTLY for paid plan...');
                                const bridgeResponse = await fetch(`${customerBridgeLambdaUrl}/vendor-update`, {
                                    method: 'POST',
                                    mode: 'cors',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        email: formData.email.toLowerCase(), // Primary key for new table structure
                                        vendorId: customer_id,
                                        updateType: 'vendor_registered',
                                        timestamp: new Date().toISOString(),
                                        data: {
                                            businessName: formData.businessName,
                                            email: formData.email,
                                            phone: formData.phone,
                                            posSystem: formData.posSystem,
                                            plan: formData.selectedPlan,
                                            status: 'active'
                                        }
                                    })
                                });
                                
                                if (bridgeResponse.ok) {
                                    console.log('✅ Customer bridge lambda invoked successfully for paid plan');
                                } else {
                                    console.warn('⚠️ Customer bridge lambda call failed for paid plan:', bridgeResponse.status);
                                }
                            } catch (bridgeError) {
                                console.warn('⚠️ Failed to invoke customer bridge lambda for paid plan:', bridgeError);
                            }
                        } else {
                            console.warn('⚠️ REACT_APP_CUSTOMER_BRIDGE_LAMBDA_URL not configured');
                        }
                        
                        // Check if any POS system was selected
                        if (formData.posSystem) {
                            console.log(`🔗 ${formData.posSystem} POS detected - redirecting to integration page`);
                            // Redirect to integration page with registration data and POS system
                            const integrationUrl = `/vendor-integration?token=reg_${Date.now()}&email=${encodeURIComponent(formData.email)}&business=${encodeURIComponent(formData.businessName)}&plan=${encodeURIComponent(formData.selectedPlan)}&pos=${encodeURIComponent(formData.posSystem.toLowerCase())}&customer_id=${encodeURIComponent(customer_id)}`;
                            navigate(integrationUrl);
                        } else {
                            setSuccess('✅ Registration complete! You\'ve been added to our vendor database. Check your email for next steps.');
                        }
                    } else {
                        const errorText = await response.text();
                        console.log('❌ [DEBUG] Lambda function failed with status:', response.status);
                        console.log('❌ [DEBUG] Error response:', errorText);
                        throw new Error(`Lambda function failed: ${response.status}`);
                    }
                } catch (lambdaError) {
                    console.error('❌ Error calling Lambda function:', lambdaError);
                    console.log('🔍 [DEBUG] Lambda error details:', {
                        name: lambdaError.name,
                        message: lambdaError.message,
                        stack: lambdaError.stack
                    });
                    setError('Registration successful but database update failed. We\'ll contact you to complete setup.');
                }
            } else {
                // Free plan - just add to database
                setSuccess('Adding you to our vendor database...');
                
                try {
                    console.log('📧 Adding vendor to database via Lambda function (FREE PLAN)...');
                    
                    const formDataForLambda = createFormData();
                    console.log('🔍 [DEBUG] Data being sent to Lambda (FREE PLAN):', formDataForLambda);
                    console.log('🔍 [DEBUG] Lambda function URL (FREE PLAN):', process.env.REACT_APP_LAMBDA_FUNCTION_URL || 'YOUR_LAMBDA_FUNCTION_URL_HERE');
                    
                    const response = await fetch(process.env.REACT_APP_LAMBDA_FUNCTION_URL || 'YOUR_LAMBDA_FUNCTION_URL_HERE', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formDataForLambda)
                    });
                    
                    console.log('🔍 [DEBUG] Response status (FREE PLAN):', response.status);
                    console.log('🔍 [DEBUG] Response headers (FREE PLAN):', Object.fromEntries(response.headers.entries()));
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('✅ Lambda function response (FREE PLAN):', result);
                        console.log('🔍 [DEBUG] Response data type (FREE PLAN):', typeof result);
                        console.log('🔍 [DEBUG] Response keys (FREE PLAN):', Object.keys(result));
                        
                        // Now invoke the customer bridge lambda DIRECTLY to store the vendor data
                        const customerBridgeLambdaUrl = process.env.REACT_APP_CUSTOMER_BRIDGE_LAMBDA_URL || 'https://e6v7rbwuqctzlkkcqtsxd4tgdy0iaogt.lambda-url.us-east-1.on.aws';
                        let customer_id = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        
                        if (customerBridgeLambdaUrl) {
                            try {
                                console.log('🔗 Invoking customer bridge lambda DIRECTLY for free plan...');
                                const bridgeResponse = await fetch(`${customerBridgeLambdaUrl}/vendor-update`, {
                                    method: 'POST',
                                    mode: 'cors',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        email: formData.email.toLowerCase(), // Primary key for new table structure
                                        vendorId: customer_id,
                                        updateType: 'vendor_registered',
                                        timestamp: new Date().toISOString(),
                                        data: {
                                            businessName: formData.businessName,
                                            email: formData.email,
                                            phone: formData.phone,
                                            posSystem: formData.posSystem,
                                            plan: formData.selectedPlan,
                                            status: 'active'
                                        }
                                    })
                                });
                                
                                if (bridgeResponse.ok) {
                                    console.log('✅ Customer bridge lambda invoked successfully for free plan');
                                } else {
                                    console.warn('⚠️ Customer bridge lambda call failed for free plan:', bridgeResponse.status);
                                }
                            } catch (bridgeError) {
                                console.warn('⚠️ Failed to invoke customer bridge lambda for free plan:', bridgeError);
                            }
                        } else {
                            console.warn('⚠️ REACT_APP_CUSTOMER_BRIDGE_LAMBDA_URL not configured');
                        }
                        
                        // Check if any POS system was selected
                        if (formData.posSystem) {
                            console.log(`🔗 ${formData.posSystem} POS detected - redirecting to integration page`);
                            // Redirect to integration page with registration data and POS system
                            const integrationUrl = `/vendor-integration?token=reg_${Date.now()}&email=${encodeURIComponent(formData.email)}&business=${encodeURIComponent(formData.businessName)}&plan=${encodeURIComponent(formData.selectedPlan)}&pos=${encodeURIComponent(formData.posSystem.toLowerCase())}&customer_id=${encodeURIComponent(customer_id)}`;
                            navigate(integrationUrl);
                        } else {
                            setSuccess('✅ Registration complete! You\'ve been added to our vendor database. Check your email for next steps.');
                        }
                    } else {
                        const errorText = await response.text();
                        console.log('❌ [DEBUG] Lambda function failed with status (FREE PLAN):', response.status);
                        console.log('❌ [DEBUG] Error response (FREE PLAN):', errorText);
                        throw new Error(`Lambda function failed: ${response.status}`);
                    }
                } catch (lambdaError) {
                    console.error('❌ Error calling Lambda function (FREE PLAN):', lambdaError);
                    console.log('🔍 [DEBUG] Lambda error details (FREE PLAN):', {
                        name: lambdaError.name,
                        message: lambdaError.message,
                        stack: lambdaError.stack
                    });
                    setError('Registration successful but database update failed. We\'ll contact you to complete setup.');
                }
            }
        } catch (error) {
            console.error('❌ Form submission error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="direct-signup-container">
            <div className="direct-signup-inner">
                {/* Pricing Tiers - Side by Side */}
                <div className="pricing-tiers-container">
                    <div className="pricing-title">
                    </div>
                    
                    <div className="pricing-tiers-horizontal">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`pricing-tier ${plan.featured ? 'featured' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                            >
                                {plan.featured && <div className="tier-badge">Most Popular</div>}
                                <div className="tier-header">
                                    <h3>{plan.name}</h3>
                                </div>
                                <div className="tier-price">{plan.price}</div>
                                <div className="tier-period">{plan.period}</div>
                                <ul className="tier-features">
                                    {plan.features.map((feature, index) => (
                                        <li key={index}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    
                    <div className="pricing-info">
                        <p>All plans include a 30-day money-back guarantee. No setup fees.</p>
                    </div>
                </div>

                {/* Registration Form - Beneath Tiers */}
                <div className="registration-form-container">
                    <div className="direct-signup-form">
                        <div className="direct-signup-title">
                            <h3>Vendor Registration</h3>
                            <p>Complete your registration below</p>
                            <div className="environment-badge">
                                🔧 {stripeEnvironment.toUpperCase()} MODE
                                {stripeEnvironment === 'test' && ' - No real charges'}
                                {stripeEnvironment === 'production' && ' - Real charges'}
                            </div>
                        </div>
                        
                        {error && (
                            <div className="error-message">
                                ❌ {error}
                            </div>
                        )}

                        {success && (
                            <div className="success-message">
                                ✅ {success}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit} className="registration-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Select Your Plan *</label>
                                    <select 
                                        required
                                        name="selectedPlan"
                                        value={formData.selectedPlan}
                                        onChange={handlePlanChange}
                                        className="form-input"
                                    >
                                        <option value="">Choose your plan</option>
                                        <option value="free">⭐ Forever Free Plan - $0/month</option>
                                        <option value="pro">💼 Pro Plan - $39.99/month (2 months free!)</option>
                                        <option value="ultimate">🚀 Ultimate Plan - $79.99/month (2 months free!)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Business Name *</label>
                                    <input 
                                        type="text" 
                                        name="businessName"
                                        required
                                        value={formData.businessName}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Your business name"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Vendor Type *</label>
                                    <select 
                                        name="vendorType"
                                        required
                                        value={formData.vendorType}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    >
                                        <option value="">Select vendor type</option>
                                        <option value="food-truck">Food Truck</option>
                                        <option value="arts-crafts">Arts & Crafts</option>
                                        <option value="jewelry">Jewelry</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="home-decor">Home Decor</option>
                                        <option value="beauty">Beauty & Wellness</option>
                                        <option value="entertainment">Entertainment</option>
                                        <option value="services">Services</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div id="cuisine-type-section" className="form-group hidden">
                                    <label>Cuisine Type</label>
                                    <select 
                                        name="cuisineType"
                                        value={formData.cuisineType}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    >
                                        <option value="">Select cuisine type</option>
                                        <option value="mexican">Mexican</option>
                                        <option value="pizza">Pizza</option>
                                        <option value="jamaican">Jamaican</option>
                                        <option value="desserts">Desserts</option>
                                        <option value="bbq">BBQ</option>
                                        <option value="asian">Asian</option>
                                        <option value="mediterranean">Mediterranean</option>
                                        <option value="american">American</option>
                                        <option value="vegetarian">Vegetarian</option>
                                        <option value="seafood">Seafood</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number *</label>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div id="pos-system-section" className="form-group">
                                <label>POS System *</label>
                                <select 
                                    name="posSystem"
                                    value={formData.posSystem}
                                    onChange={handleInputChange}
                                    className="form-input"
                                >
                                    <option value="">Select your POS system</option>
                                    <option value="square">Square</option>
                                    <option value="stripe">Stripe</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="clover">Clover</option>
                                    <option value="toast">Toast</option>
                                    <option value="lightspeed">Lightspeed</option>
                                    <option value="shopify">Shopify</option>
                                    <option value="sumup">SumUp</option>
                                    <option value="none">No POS system</option>
                                    <option value="other">Other</option>
                                </select>
                                
                                {/* POS System Error Message - Show when form is submitted without POS selection */}
                                {error && error.includes('Please select your POS system') && (
                                    <div className="pos-error-message">
                                        🚨 POS System selection is REQUIRED - Please select your POS system to continue
                                    </div>
                                )}
                            </div>

                            {/* Credit Card Section - Only show for Pro/Ultimate */}
                            <div id="credit-card-section" className="credit-card-section">
                                <h4>💳 Payment Information</h4>
                                
                                <div className="form-group">
                                    <label>Card Details *</label>
                                    <div className="stripe-element-container">
                                        <CardElement 
                                            options={{
                                                style: {
                                                    base: {
                                                        fontSize: '16px',
                                                        color: '#424770',
                                                        fontFamily: 'inherit',
                                                        '::placeholder': {
                                                            color: '#aab7c4',
                                                        },
                                                        padding: '0px',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                    },
                                                    invalid: {
                                                        color: '#e53e3e',
                                                        iconColor: '#e53e3e',
                                                    },
                                                    complete: {
                                                        color: '#28a745',
                                                        iconColor: '#28a745',
                                                    },
                                                },
                                                hidePostalCode: true,
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Name on Card *</label>
                                    <input 
                                        type="text" 
                                        id="name-on-card"
                                        name="name-on-card"
                                        className="form-input"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="submit-section">
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="submit-button"
                                >
                                    {loading ? '⏳ Processing...' : 'Register as Vendor'}
                                </button>
                            </div>

                            <div className="form-footer">
                                <p>Registration includes CRM integration and Stripe payment processing</p>
                                <p>We'll contact you within 24 hours to complete your setup</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DirectSignup = () => {
    const [stripe, setStripe] = useState(null);
    const [stripeEnvironment, setStripeEnvironment] = useState('test');

    // Initialize Stripe with environment toggle
    useEffect(() => {
        const initStripe = async () => {
            // Debug: Log all available environment variables
            console.log('🔍 Environment Variables Debug:');
            console.log('REACT_APP_STRIPE_ENVIRONMENT:', process.env.REACT_APP_STRIPE_ENVIRONMENT);
            console.log('REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY:', process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY ? 'Present' : 'Missing');
            console.log('REACT_APP_STRIPE_PUBLISHABLE_KEY:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing');
            
            // Determine which Stripe key to use based on environment
            const environment = process.env.REACT_APP_STRIPE_ENVIRONMENT || 'test';
            setStripeEnvironment(environment);
            
            let stripeKey;
            if (environment === 'test') {
                stripeKey = process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY;
                console.log('🔧 Stripe Environment: TEST MODE');
                console.log('🔑 Test key found:', !!stripeKey);
            } else {
                stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
                console.log('🚀 Stripe Environment: PRODUCTION MODE');
                console.log('🔑 Production key found:', !!stripeKey);
            }
            
            if (!stripeKey) {
                console.error('❌ Stripe key not found for environment:', environment);
                console.error('❌ Available keys:');
                console.error('  - REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY:', !!process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY);
                console.error('  - REACT_APP_STRIPE_PUBLISHABLE_KEY:', !!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
                
                // Fallback: Try to use the old variable names if new ones aren't available
                if (environment === 'test') {
                    stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
                    console.log('🔄 Fallback: Trying old variable name for test mode');
                }
                
                if (!stripeKey) {
                    console.error('❌ No Stripe keys available. Please check your .env file.');
                    return;
                }
            }
            
            console.log('🔑 Using Stripe key:', stripeKey.substring(0, 20) + '...');
            
            const stripeInstance = await loadStripe(stripeKey);
            setStripe(stripeInstance);
        };
        
        initStripe();
    }, []);

    // Function to toggle environment (for development/testing purposes)
    const toggleEnvironment = () => {
        const newEnvironment = stripeEnvironment === 'test' ? 'production' : 'test';
        setStripeEnvironment(newEnvironment);
        
        // Reinitialize Stripe with new environment
        const initStripe = async () => {
            let stripeKey;
            if (newEnvironment === 'test') {
                stripeKey = process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY;
                console.log('🔧 Switched to Stripe TEST MODE');
            } else {
                stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
                console.log('🚀 Switched to Stripe PRODUCTION MODE');
            }
            
            if (stripeKey) {
                const stripeInstance = await loadStripe(stripeKey);
                setStripe(stripeInstance);
            }
        };
        
        initStripe();
    };

    if (!stripe) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '50px', 
                fontSize: '18px',
                color: '#666' 
            }}>
                <div>⏳ Loading payment system...</div>
                <div style={{ 
                    marginTop: '20px', 
                    fontSize: '14px', 
                    padding: '10px', 
                    backgroundColor: stripeEnvironment === 'test' ? '#fff3cd' : '#d1ecf1',
                    border: `1px solid ${stripeEnvironment === 'test' ? '#ffeaa7' : '#bee5eb'}`,
                    borderRadius: '8px',
                    color: stripeEnvironment === 'test' ? '#856404' : '#0c5460'
                }}>
                    🔧 Stripe Environment: {stripeEnvironment.toUpperCase()}
                    {stripeEnvironment === 'test' && ' (Test Mode - No real charges)'}
                    {stripeEnvironment === 'production' && ' (Production Mode - Real charges)'}
                </div>
                
                {/* Environment Toggle for Development */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{ marginTop: '20px' }}>
                        <button 
                            onClick={toggleEnvironment}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🔄 Toggle to {stripeEnvironment === 'test' ? 'PRODUCTION' : 'TEST'}
                        </button>
                        <p style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                            Development only - toggle between environments
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Elements stripe={stripe}>
            <DirectSignupForm stripeEnvironment={stripeEnvironment} />
        </Elements>
    );
};

export default DirectSignup; 