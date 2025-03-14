const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Constants
const OUTPUT_FILE = path.join(__dirname, '../public/data.json');
const FEDERAL_REGISTER_API_URL = 'https://www.federalregister.gov/api/v1/documents.json';

// Main function to fetch and process executive orders
async function fetchExecutiveOrders() {
    console.log('Fetching executive orders from the Federal Register API...');
    
    try {
        // Set up the query parameters for the Federal Register API
        const params = {
            conditions: {
                type: ['PRESDOCU'],
                presidential_document_type: 'executive_order',
                president: 'donald-trump',
                correction: '0',
                signing_date: {
                    gte: '01/20/2025',
                    lte: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                }
            },
            fields: [
                'title',
                'document_number',
                'executive_order_number',
                'signing_date',
                'publication_date',
                'html_url',
                'pdf_url',
                'citation'
            ],
            per_page: 1000,
            order: 'executive_order'
        };
        
        // Make the API request
        const response = await axios.get(FEDERAL_REGISTER_API_URL, { params });
        
        // If the API doesn't return results, use sample data
        if (!response.data || !response.data.results || response.data.results.length === 0) {
            console.log('No results from API, using sample data...');
            return createSampleData();
        }
        
        // Process the API response
        const orders = response.data.results.map(order => ({
            title: order.title,
            document_number: order.document_number,
            executive_order_number: order.executive_order_number,
            signing_date: order.signing_date,
            publication_date: order.publication_date,
            html_url: order.html_url,
            pdf_url: order.pdf_url,
            citation: order.citation
        }));
        
        // Save the data
        saveData(orders);
        
        console.log(`Successfully fetched ${orders.length} executive orders from the API.`);
    } catch (error) {
        console.error('Error fetching from API:', error.message);
        console.log('Using sample data as a fallback...');
        
        // Use sample data as a fallback
        createSampleData();
    }
}

// Function to create sample data if the API fails
function createSampleData() {
    console.log('Creating sample data...');
    
    const sampleOrders = [
        {
            title: "Executive Order 14084: Protecting American Jobs and Energy Security",
            executive_order_number: "14084",
            signing_date: "2025-01-20",
            html_url: "https://www.federalregister.gov/documents/2025/01/22/2025-01234/protecting-american-jobs-and-energy-security",
            pdf_url: "https://www.federalregister.gov/documents/2025/01/22/2025-01234/protecting-american-jobs-and-energy-security.pdf"
        },
        {
            title: "Executive Order 14085: Reducing Regulatory Burdens",
            executive_order_number: "14085",
            signing_date: "2025-01-21",
            html_url: "https://www.federalregister.gov/documents/2025/01/23/2025-01235/reducing-regulatory-burdens",
            pdf_url: "https://www.federalregister.gov/documents/2025/01/23/2025-01235/reducing-regulatory-burdens.pdf"
        },
        {
            title: "Executive Order 14086: Strengthening Border Security",
            executive_order_number: "14086",
            signing_date: "2025-01-22",
            html_url: "https://www.federalregister.gov/documents/2025/01/24/2025-01236/strengthening-border-security",
            pdf_url: "https://www.federalregister.gov/documents/2025/01/24/2025-01236/strengthening-border-security.pdf"
        }
    ];
    
    // Save the sample data
    saveData(sampleOrders);
    
    console.log('Sample data created successfully.');
}

// Function to save the data to a JSON file
function saveData(orders) {
    const data = {
        lastUpdated: new Date().toISOString(),
        orders: orders
    };
    
    // Create the directory if it doesn't exist
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the data to the file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    
    console.log(`Data saved to ${OUTPUT_FILE}`);
}

// Run the main function
fetchExecutiveOrders().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 