document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Fetch executive orders data
    fetchExecutiveOrders();
    
    // Set up event listeners
    document.getElementById('search-button').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Set up sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.dataset.sort;
            sortOrders(sortBy);
        });
    });
});

// Global variables
let allOrders = [];
let currentOrders = [];
let currentSort = { field: 'number', ascending: false };
let currentPage = 1;
const ordersPerPage = 10;

// Fetch executive orders from the data file
async function fetchExecutiveOrders() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        allOrders = data.orders;
        currentOrders = [...allOrders];
        
        // Update last updated date
        document.getElementById('last-updated').textContent = new Date(data.lastUpdated).toLocaleString();
        
        // Sort and display orders
        sortOrders('number');
    } catch (error) {
        console.error('Error fetching executive orders:', error);
        document.getElementById('orders-table-body').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    Failed to load executive orders. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Sort orders by the specified field
function sortOrders(field) {
    // Update sort direction
    if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.field = field;
        currentSort.ascending = true;
    }
    
    // Update header styling
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('active');
        if (header.dataset.sort === field) {
            header.classList.add('active');
        }
    });
    
    // Sort the orders
    currentOrders.sort((a, b) => {
        let valueA, valueB;
        
        if (field === 'number') {
            valueA = parseInt(a.executive_order_number || '0');
            valueB = parseInt(b.executive_order_number || '0');
        } else if (field === 'date') {
            valueA = new Date(a.signing_date || '');
            valueB = new Date(b.signing_date || '');
        } else {
            valueA = a[field] || '';
            valueB = b[field] || '';
        }
        
        if (valueA < valueB) return currentSort.ascending ? -1 : 1;
        if (valueA > valueB) return currentSort.ascending ? 1 : -1;
        return 0;
    });
    
    // Reset to first page and display
    currentPage = 1;
    displayOrders();
}

// Display orders with pagination
function displayOrders() {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToDisplay = currentOrders.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('orders-table-body');
    
    if (ordersToDisplay.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No executive orders found matching your search.</td>
            </tr>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // Generate table rows
    tableBody.innerHTML = ordersToDisplay.map(order => `
        <tr>
            <td>${order.executive_order_number || 'N/A'}</td>
            <td>${order.title || 'Untitled'}</td>
            <td>${formatDate(order.signing_date)}</td>
            <td>
                ${order.html_url ? `<a href="${order.html_url}" target="_blank" class="btn btn-sm btn-outline-primary me-1">View</a>` : ''}
                ${order.pdf_url ? `<a href="${order.pdf_url}" target="_blank" class="btn btn-sm btn-outline-danger">PDF</a>` : ''}
            </td>
        </tr>
    `).join('');
    
    // Generate pagination
    generatePagination();
}

// Generate pagination controls
function generatePagination() {
    const totalPages = Math.ceil(currentOrders.length / ordersPerPage);
    
    if (totalPages <= 1) {
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    let paginationHTML = '<ul class="pagination">';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    paginationHTML += '</ul>';
    
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = paginationHTML;
    
    // Add event listeners to pagination links
    paginationElement.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                displayOrders();
                // Scroll to top of table
                document.querySelector('.table').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Perform search based on input
function performSearch() {
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    
    if (searchTerm === '') {
        currentOrders = [...allOrders];
    } else {
        currentOrders = allOrders.filter(order => {
            return (
                (order.title && order.title.toLowerCase().includes(searchTerm)) ||
                (order.executive_order_number && order.executive_order_number.toString().includes(searchTerm))
            );
        });
    }
    
    currentPage = 1;
    displayOrders();
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
} 