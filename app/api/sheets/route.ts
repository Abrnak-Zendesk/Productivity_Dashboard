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

export async function GET() {
  try {
    const CSV_URL = process.env.GOOGLE_SHEET_CSV_URL ||
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vS3egfTuIwnLyKLIG0ENYIBywbyFXR_BTy6BUFr9dRLauamWBisiZPL-t386oPpt-37YujeMhFR33lY/pub?gid=63862613&single=true&output=csv'

    const response = await fetch(CSV_URL, {
      cache: 'no-store',
    })

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
