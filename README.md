# Google Sheets Dashboard

A modern, interactive dashboard that visualizes data from Google Sheets with real-time charts, tables, and KPIs.

## Features

- Real-time data fetching from Google Sheets
- Interactive charts (bar, line charts)
- Sortable and filterable data tables
- KPI metrics with calculations
- Responsive design
- Dark mode support

## Quick Start

### 1. Install Dependencies

```bash
cd ~/google-sheets-dashboard
npm install
```

### 2. Configure Google Sheets API

You have two options for connecting to Google Sheets:

#### Option A: API Key (Simpler, Read-Only)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
5. Make your Google Sheet public:
   - Open your Google Sheet
   - Click "Share" > "Change to anyone with the link"
   - Set to "Viewer"

#### Option B: Service Account (More Secure)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create
5. Generate a key:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format and download
6. Share your Google Sheet with the service account email address

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file:

**For API Key approach:**
```
GOOGLE_SHEET_ID=1abc123def456
GOOGLE_SHEET_RANGE=Sheet1!A1:Z1000
GOOGLE_API_KEY=your-api-key-here
```

**For Service Account approach:**
```
GOOGLE_SHEET_ID=1abc123def456
GOOGLE_SHEET_RANGE=Sheet1!A1:Z1000
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
```

**How to find your Sheet ID:**
Your Google Sheets URL looks like:
`https://docs.google.com/spreadsheets/d/1abc123def456/edit`

The Sheet ID is: `1abc123def456`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add your environment variables in the Vercel dashboard
5. Deploy

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `.next` folder to Netlify
3. Add environment variables in Netlify dashboard

## Customization

### Modify the Data Range

Edit the `GOOGLE_SHEET_RANGE` in your `.env` file:
- `Sheet1!A1:Z1000` - Read from Sheet1, columns A-Z, rows 1-1000
- `Sales!A:E` - Read all rows from columns A-E in the "Sales" sheet

### Customize Charts

Edit `/app/page.tsx` to:
- Change chart types
- Adjust colors
- Add more visualizations
- Modify KPI calculations

### Style Changes

The dashboard uses Tailwind CSS. Modify colors and styles in:
- `/app/page.tsx` - Component styles
- `/app/globals.css` - Global styles
- `/tailwind.config.ts` - Theme configuration

## Troubleshooting

**"Failed to fetch data"**
- Check that your Google Sheet ID is correct
- Verify your API key or service account credentials
- Ensure the sheet is shared properly

**"No data available"**
- Check that your sheet has data in the specified range
- Verify the sheet name in GOOGLE_SHEET_RANGE

**Charts not showing**
- Ensure you have numeric data in your columns
- Check that column headers are in the first row

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts
- Google Sheets API

## License

MIT
