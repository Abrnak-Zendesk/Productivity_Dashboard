import { NextResponse } from 'next/server'

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell)
        rows.push(currentRow)
        currentRow = []
        currentCell = ''
      }
    } else {
      currentCell += char
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return rows.filter(row => row.some(cell => cell.trim() !== ''))
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DashboardBot/1.0)',
        },
      })

      if (response.ok) {
        return response
      }

      // If we get a bad response, wait before retrying
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw new Error('Failed after retries')
}

export async function GET() {
  try {
    const CSV_URL = process.env.GOOGLE_SHEET_PIPELINE_CSV_URL ||
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiWS_IaadIALOcBKSITXcZsvJ8qvSbmTi-eAG1VxvYlMmpFnax-dcvJhPxr612z8FKFxeiVi1z1TA6/pub?gid=0&single=true&output=csv'

    const response = await fetchWithRetry(CSV_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`)
    }

    const csvText = await response.text()
    const rows = parseCSV(csvText)

    if (rows.length === 0) {
      return NextResponse.json({ headers: [], rows: [] })
    }

    return NextResponse.json({
      headers: rows[0],
      rows: rows.slice(1),
    })

  } catch (error) {
    console.error('Error fetching Google Sheets data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from Google Sheets' },
      { status: 500 }
    )
  }
}
