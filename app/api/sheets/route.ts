import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
    const filePath = path.join(process.cwd(), 'data', 'productivity.csv')
    const csvText = fs.readFileSync(filePath, 'utf-8')
    const rows = parseCSV(csvText)

    if (rows.length === 0) {
      return NextResponse.json({ headers: [], rows: [] })
    }

    return NextResponse.json({
      headers: rows[0],
      rows: rows.slice(1),
    })

  } catch (error) {
    console.error('Error reading CSV file:', error)
    return NextResponse.json(
      { error: 'Failed to read data from CSV file' },
      { status: 500 }
    )
  }
}
