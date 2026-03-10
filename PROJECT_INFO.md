# SMB Productivity Dashboard - Project Info

## 📍 Project Location
`/Users/adam.brnak/google-sheets-dashboard/`

## 🎯 What This Dashboard Does
- Connects to Google Sheets via published CSV URL
- Displays sales productivity metrics (Activity, Pipeline, Bookings)
- Features: Multi-select filters, frozen columns, conditional formatting, sortable tables
- Auto-refreshes data at midnight PST daily
- Zendesk branded (#2F4538 green, #D4FF5E lime yellow)

## 🚀 To Run Locally
```bash
cd ~/google-sheets-dashboard
npm run dev
# Opens at http://localhost:3000
```

## 🔧 Key Files to Edit
- **`/app/page.tsx`** - Main dashboard UI and logic
- **`/app/api/sheets/route.ts`** - Google Sheets data fetching
- **`/app/globals.css`** - Global styles
- **`/tailwind.config.ts`** - Color theme configuration
- **`/.env`** - Contains your Google Sheet CSV URL (GOOGLE_SHEET_CSV_URL)
- **`/public/zendesk-logo.png`** - Your logo file

## 📊 Current Google Sheets Setup
- Uses "Publish to web" as CSV
- URL stored in `.env` file
- Updates when Google Sheet changes (5min cache)

## 🌐 Next Steps to Deploy
1. Get company Git repo access
2. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-COMPANY/repo-name.git
   git push -u origin main
   ```
3. Deploy to Vercel:
   - Go to vercel.com
   - Import GitHub repo
   - Add env variable: `GOOGLE_SHEET_CSV_URL`
   - Deploy!

## 💡 To Get Help Later
If you return to Claude Code:
1. Navigate to this folder: `cd ~/google-sheets-dashboard`
2. Say: "I need help with my Next.js dashboard" or describe what you want to change
3. Claude will read your files and understand the project

## 🔗 Original Conversation
[Bookmark this conversation URL to return to the exact context]

---

**Built with:** Next.js 14, TypeScript, Tailwind CSS, Recharts, Google Sheets API
**Created:** March 2026
