# Cash Flow Management Application

A comprehensive React TypeScript application for managing business cash flow with advanced analytics, forecasting, and transaction management
capabilities.

## Features

### 📊 Dashboard Analytics
- **Cash Inflows Widget**: Track revenue streams with visual charts and category breakdowns
- **Cash Outflows Widget**: Monitor expenses with spending analysis and trend visualization
- **Cash Runway Widget**: Calculate months of cash remaining with color-coded alerts
- **13-Week Cash Forecast**: Project future cash balances with scenario planning

### 💰 Transaction Management
- Import transactions from CSV files
- Manual transaction entry with comprehensive form
- Edit and delete existing transactions
- Advanced filtering and search capabilities
- Category-based organization

### 📈 Advanced Analytics
- Monthly cash flow trends
- Category-wise spending analysis
- Burn rate calculations
- Runway projections with historical trends
- Scenario-based forecasting (optimistic/realistic/pessimistic)

### 🔧 Technical Features
- React 18+ with TypeScript
- Responsive design with Tailwind CSS
- Local storage for data persistence
- CSV import/export functionality
- Interactive charts with Recharts
- Modern UI components

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Clone or create the project directory**
```bash
mkdir cash-flow-manager
cd cash-flow-manager


 2 Install dependencies


npm install


 3 Start the development server


npm start


 4 Open your browser Navigate to http://localhost:3000

Building for Production


npm run build



Usage

Importing Transaction Data

 1 Click the "Import CSV" button in the header
 2 Select your CSV file with the following format:


Transaction date,Transaction ID,Merchant name,Payment ref ID / Check No,Description,Debit amount,Credit amount,Balance
2024-06-01,TXN100000,Rent,,Monthly rent,227.67,0.0,9772.33


 3 The application will automatically categorize transactions and update all analytics

Manual Transaction Entry

 1 Navigate to the "Transactions" tab
 2 Click "Add Transaction"
 3 Fill in the transaction details:
    • Date
    • Type (Inflow/Outflow)
    • Amount
    • Category
    • Description
    • Merchant (optional)
    • Payment Reference (optional)

Dashboard Analytics

The dashboard provides four main widgets:

 1 Cash Inflows: Shows revenue trends and income source breakdown
 2 Cash Outflows: Displays expense analysis and spending patterns
 3 Cash Runway: Calculates how many months of cash remain based on burn rate
 4 Cash Forecast: Projects 13-week cash balance with scenario planning

Data Export

Click "Export Data" to download your transactions as a CSV file for backup or external analysis.


Project Structure


src/
├── components/
│   ├── Dashboard/
│   │   ├── CashInflowsWidget.tsx
│   │   ├── CashOutflowsWidget.tsx
│   │   ├── CashRunwayWidget.tsx
│   │   └── CashForecastWidget.tsx
│   ├── Layout/
│   │   └── Header.tsx
│   └── TransactionManager/
│       ├── TransactionList.tsx
│       └── TransactionForm.tsx
├── hooks/
│   └── useLocalStorage.ts
├── types/
│   └── index.ts
├── utils/
│   ├── calculations.ts
│   └── csvParser.ts
├── App.tsx
├── index.tsx
└── index.css



Key Features Explained

Automatic Transaction Categorization

The application automatically categorizes imported transactions based on merchant names and descriptions:

 • Revenue (Stripe, Square payments)
 • Food Inventory (Sysco, US Foods, etc.)
 • Beverages (PepsiCo, Coca-Cola)
 • Equipment & Maintenance
 • Utilities, Rent, Payroll
 • And more...

Cash Runway Calculation

 • Analyzes last 6 months of expenses to calculate monthly burn rate
 • Divides current balance by burn rate to determine runway
 • Color-coded alerts: Green (12+ months), Yellow (6-12 months), Red (<6 months)

13-Week Forecast

 • Uses historical patterns to project future cash flows
 • Provides optimistic, realistic, and pessimistic scenarios
 • Shows weekly breakdown of projected inflows and outflows

Responsive Design

 • Fully responsive layout works on desktop, tablet, and mobile
 • Touch-friendly interface for mobile transaction management
 • Optimized charts and tables for all screen sizes


Data Storage

The application uses browser localStorage to persist data. Your transaction data is stored locally and never sent to external servers, ensuring
privacy and security.


Browser Compatibility

 • Chrome 90+
 • Firefox 88+
 • Safari 14+
 • Edge 90+


Contributing

 1 Fork the repository
 2 Create a feature branch
 3 Make your changes
 4 Add tests if applicable
 5 Submit a pull request


License

This project is licensed under the MIT License.

▌ ▌ ▌ ▌ ▌ ▌ ▌ REPLACE



Now let's create a sample data file to help users test the application:

sample-data.csv
```csv
<<<<<<< SEARCH
=======
Transaction date,Transaction ID,Merchant name,Payment ref ID / Check No,Description,Debit amount,Credit amount,Balance
2024-06-01,TXN100000,Rent,,Monthly rent,2500.00,0.0,47500.00
2024-06-01,TXN100001,Stripe,,Customer payment,0.0,3200.00,50700.00
2024-06-02,TXN100002,Sysco,,Food inventory,850.00,0.0,49850.00
2024-06-03,TXN100003,Square,,POS sale,0.0,1200.00,51050.00
2024-06-03,TXN100004,Utilities Co.,,Utilities,450.00,0.0,50600.00
2024-06-04,TXN100005,Payroll,,Payroll,3500.00,0.0,47100.00
2024-06-05,TXN100006,Amazon,,Equipment purchase,320.00,0.0,46780.00
2024-06-06,TXN100007,Stripe,,Customer payment,0.0,2800.00,49580.00
2024-06-07,TXN100008,PepsiCo,,Beverage restock,180.00,0.0,49400.00
2024-06-08,TXN100009,Square,,POS sale,0.0,1500.00,50900.00
2024-06-09,TXN100010,Chase Bank,,Banking fee,25.00,0.0,50875.00