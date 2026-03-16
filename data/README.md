# Dashboard Data Files

This folder contains the CSV data files used by the dashboards.

## Updating Data

To update the dashboard with new data from Google Sheets:

1. **Export from Google Sheets:**
   - Open your Google Sheet (Productivity or Pipeline)
   - File → Download → Comma Separated Values (.csv)

2. **Replace the files:**
   - `productivity.csv` - Data for the SMB Productivity Dashboard
   - `pipeline.csv` - Data for the Pipeline Dashboard

3. **Deploy the update:**
   ```bash
   git add data/
   git commit -m "Update dashboard data"
   git push
   ```

Vercel will automatically deploy the updated dashboard with the new data.

## File Names

- **productivity.csv** - Main SMB Productivity Dashboard data
- **pipeline.csv** - Pipeline Dashboard data

⚠️ **Important:** Keep these exact filenames. The dashboard expects these specific file names.
