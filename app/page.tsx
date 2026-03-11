'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AuthWrapper from './auth'

interface SheetData {
  headers: string[]
  rows: any[][]
}

export default function Dashboard() {
  const [data, setData] = useState<SheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [regionFilter, setRegionFilter] = useState<string[]>([])
  const [directorFilter, setDirectorFilter] = useState<string[]>([])
  const [managerFilter, setManagerFilter] = useState<string[]>([])
  const [columnFilters, setColumnFilters] = useState<{ [key: number]: string }>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchData()
    
    // Schedule midnight PST refresh
    const scheduleMidnightRefresh = () => {
      const now = new Date()
      const pstOffset = -8 * 60 // PST is UTC-8
      const nowPST = new Date(now.getTime() + (now.getTimezoneOffset() + pstOffset) * 60000)
      
      // Calculate ms until midnight PST
      const midnight = new Date(nowPST)
      midnight.setHours(24, 0, 0, 0)
      const msUntilMidnight = midnight.getTime() - nowPST.getTime()
      
      // Set timeout for midnight refresh
      const timeoutId = setTimeout(() => {
        fetchData()
        scheduleMidnightRefresh() // Schedule next day's refresh
      }, msUntilMidnight)
      
      return timeoutId
    }
    
    const timeoutId = scheduleMidnightRefresh()
    return () => clearTimeout(timeoutId)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sheets', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = () => {
    fetchData()
  }

  // Parse column indices from actual data
  const columnIndices = useMemo(() => {
    if (!data || data.rows.length === 0) return null

    const actualHeaders = data.rows[0]
    return {
      region: 1,
      director: 2,
      manager: 3,
      aeName: 4,
      roleType: 5,
      meetings: 7,
      onsites: 8,
      rbas: 9,
      totalPipegen: 10,
      bookings: 21
    }
  }, [data])

  // Define section spans
  const sectionSpans = [
    { start: 1, end: 6, name: '' }, // Region through Ramped (no section header)
    { start: 7, end: 9, name: 'Activity' }, // Meetings, Onsites, RBA's
    { start: 10, end: 20, name: 'Pipeline Generation' }, // Total Pipegen through NB COPILOT ATTACH
    { start: 21, end: 29, name: 'Bookings' } // Bookings through TOTAL AI ATTACH
  ]

  // Get unique filter values for main filters
  const filterOptions = useMemo(() => {
    if (!data || data.rows.length < 2 || !columnIndices) return { regions: [], directors: [], managers: [] }

    const dataRows = data.rows.slice(1)
    const regions = Array.from(new Set(dataRows.map(row => row[columnIndices.region]).filter(v => v)))
    const directors = Array.from(new Set(dataRows.map(row => row[columnIndices.director]).filter(v => v)))
    const managers = Array.from(new Set(dataRows.map(row => row[columnIndices.manager]).filter(v => v)))

    return { regions, directors, managers }
  }, [data, columnIndices])

  // Get unique values for column filters
  const getColumnFilterOptions = (columnIndex: number) => {
    if (!data || data.rows.length < 2) return []
    const values = data.rows.slice(1).map(row => String(row[columnIndex]).trim()).filter(v => v)
    return ['All', ...Array.from(new Set(values))]
  }

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnIndex)
      setSortDirection('asc')
    }
  }

  const handleColumnFilterChange = (columnIndex: number, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }))
  }

  const toggleMultiSelectFilter = (filterType: 'region' | 'director' | 'manager', value: string) => {
    if (filterType === 'region') {
      setRegionFilter(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      )
    } else if (filterType === 'director') {
      setDirectorFilter(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      )
    } else if (filterType === 'manager') {
      setManagerFilter(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      )
    }
  }

  const toggleSelectAll = (filterType: 'region' | 'director' | 'manager') => {
    if (filterType === 'region') {
      setRegionFilter(prev =>
        prev.length === filterOptions.regions.length ? [] : [...filterOptions.regions]
      )
    } else if (filterType === 'director') {
      setDirectorFilter(prev =>
        prev.length === filterOptions.directors.length ? [] : [...filterOptions.directors]
      )
    } else if (filterType === 'manager') {
      setManagerFilter(prev =>
        prev.length === filterOptions.managers.length ? [] : [...filterOptions.managers]
      )
    }
  }

  const getFilteredAndSortedData = () => {
    if (!data || data.rows.length < 2 || !columnIndices) return []

    let filtered = data.rows.slice(1).filter(row => {
      const matchesSearch = row.some(cell =>
        String(cell).toLowerCase().includes(searchTerm.toLowerCase())
      )
      const matchesRegion = regionFilter.length === 0 || regionFilter.includes(row[columnIndices.region])
      const matchesDirector = directorFilter.length === 0 || directorFilter.includes(row[columnIndices.director])
      const matchesManager = managerFilter.length === 0 || managerFilter.includes(row[columnIndices.manager])

      // Apply column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([colIdx, filterValue]) => {
        if (filterValue === 'All' || !filterValue) return true
        return String(row[parseInt(colIdx)]).trim() === filterValue
      })

      return matchesSearch && matchesRegion && matchesDirector && matchesManager && matchesColumnFilters
    })

    if (sortColumn !== null) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]

        const aNum = parseFloat(String(aVal).replace(/k\s*$/i, ''))
        const bNum = parseFloat(String(bVal).replace(/k\s*$/i, ''))

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }

        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
    }

    return filtered
  }

  const formatCurrency = (val: any): string => {
    if (val === null || val === undefined || val === "") return val
    const str = String(val)
    if (str.match(/[0-9]+k\s*$/i)) {
      return "$" + str
    }
    return str
  }


  const parseValue = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0
    const str = String(val).replace(/k\s*$/i, '').replace(/[,$%⛔]/g, '').trim()
    const num = parseFloat(str)
    return isNaN(num) ? 0 : num
  }

  const calculateKPIs = () => {
    if (!data || data.rows.length < 2 || !columnIndices) return null

    const filteredData = getFilteredAndSortedData()

    if (filteredData.length === 0) return null

    const aeMap = new Map<string, { activity: number[], pipegen: number[], bookings: number[] }>()

    filteredData.forEach(row => {
      const aeName = row[columnIndices.aeName]
      if (!aeName) return

      if (!aeMap.has(aeName)) {
        aeMap.set(aeName, { activity: [], pipegen: [], bookings: [] })
      }

      const aeData = aeMap.get(aeName)!

      const meetings = parseValue(row[columnIndices.meetings])
      const onsites = parseValue(row[columnIndices.onsites])
      const rbas = parseValue(row[columnIndices.rbas])
      const activitySum = meetings + onsites + rbas

      aeData.activity.push(activitySum)
      aeData.pipegen.push(parseValue(row[columnIndices.totalPipegen]))
      aeData.bookings.push(parseValue(row[columnIndices.bookings]))
    })

    const activityAvgs = Array.from(aeMap.values()).map(ae =>
      ae.activity.reduce((a, b) => a + b, 0) / ae.activity.length
    )
    const pipegenAvgs = Array.from(aeMap.values()).map(ae =>
      ae.pipegen.reduce((a, b) => a + b, 0) / ae.pipegen.length
    )
    const bookingsAvgs = Array.from(aeMap.values()).map(ae =>
      ae.bookings.reduce((a, b) => a + b, 0) / ae.bookings.length
    )

    return {
      activity: activityAvgs.reduce((a, b) => a + b, 0) / activityAvgs.length,
      pipegen: pipegenAvgs.reduce((a, b) => a + b, 0) / pipegenAvgs.length,
      bookings: bookingsAvgs.reduce((a, b) => a + b, 0) / bookingsAvgs.length
    }
  }

  const getConditionalColor = (columnIndex: number, value: any): string => {
    const filteredData = getFilteredAndSortedData()
    const columnValues = filteredData.map(row => parseValue(row[columnIndex])).filter(v => v > 0)

    if (columnValues.length === 0) return 'transparent'

    const numValue = parseValue(value)
    if (numValue === 0) return 'transparent'

    const min = Math.min(...columnValues)
    const max = Math.max(...columnValues)

    if (min === max) return 'rgb(254, 240, 138)' // yellow if all same

    const ratio = (numValue - min) / (max - min)

    // Red (low) to Yellow (mid) to Green (high)
    if (ratio < 0.5) {
      const r = 254
      const g = Math.round(202 + (240 - 202) * (ratio * 2))
      const b = Math.round(202 + (138 - 202) * (ratio * 2))
      return `rgb(${r}, ${g}, ${b})`
    } else {
      const r = Math.round(254 - (254 - 134) * ((ratio - 0.5) * 2))
      const g = Math.round(240 - (240 - 239) * ((ratio - 0.5) * 2))
      const b = Math.round(138 - (138 - 154) * ((ratio - 0.5) * 2))
      return `rgb(${r}, ${g}, ${b})`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zendesk-green mx-auto"></div>
          <p className="mt-4 text-zendesk-green font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-zendesk-green text-white px-6 py-2 rounded-lg hover:bg-zendesk-green-light transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.rows.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zendesk-green">No data available. Please configure your Google Sheets.</p>
        </div>
      </div>
    )
  }

  const filteredData = getFilteredAndSortedData()
  const kpis = calculateKPIs()
  const actualHeaders = data.rows[0]

  return (
    <AuthWrapper>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-zendesk-green shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/zendesk-logo.png" alt="Zendesk Logo" className="h-16 w-auto" />
              <div><h1 className="text-4xl font-bold text-zendesk-lime">SMB Productivity Dashboard</h1><div className="flex gap-4 mt-2"><Link href="/pipeline" className="text-sm text-gray-300 hover:text-zendesk-lime transition-colors">Pipeline Dashboard →</Link></div></div>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-sm text-gray-200">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="bg-zendesk-lime text-zendesk-green-dark px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zendesk-green rounded-lg shadow-lg border-t-4 border-zendesk-lime p-6">
              <h3 className="text-sm font-bold text-zendesk-lime uppercase tracking-wide">Activity</h3>
              <p className="text-4xl font-bold text-white mt-3">
                {kpis.activity.toFixed(1)}
              </p>
              <p className="text-sm text-gray-200 mt-2">Avg per AE (Meetings + Onsites + RBAs)</p>
            </div>
            <div className="bg-zendesk-green rounded-lg shadow-lg border-t-4 border-zendesk-lime p-6">
              <h3 className="text-sm font-bold text-zendesk-lime uppercase tracking-wide">Pipeline Generation</h3>
              <p className="text-4xl font-bold text-white mt-3">
                ${kpis.pipegen.toFixed(1)}k
              </p>
              <p className="text-sm text-gray-200 mt-2">Avg per AE</p>
            </div>
            <div className="bg-zendesk-green rounded-lg shadow-lg border-t-4 border-zendesk-lime p-6">
              <h3 className="text-sm font-bold text-zendesk-lime uppercase tracking-wide">Bookings</h3>
              <p className="text-4xl font-bold text-white mt-3">
                ${kpis.bookings.toFixed(1)}k
              </p>
              <p className="text-sm text-gray-200 mt-2">Avg per AE</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-zendesk-lime">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-zendesk-green mb-2">Search</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zendesk-lime focus:border-zendesk-green transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zendesk-green mb-2">
                Region ({regionFilter.length} selected)
              </label>
              <div className="border-2 border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto bg-white">
                <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-zendesk-lime/20 border-b border-gray-200 mb-1 pb-1">
                  <input
                    type="checkbox"
                    checked={regionFilter.length === filterOptions.regions.length && filterOptions.regions.length > 0}
                    onChange={() => toggleSelectAll('region')}
                    className="accent-zendesk-lime"
                  />
                  <span className="text-sm font-bold text-zendesk-green">All</span>
                </label>
                {filterOptions.regions.map(region => (
                  <label key={region} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-zendesk-lime/10">
                    <input
                      type="checkbox"
                      checked={regionFilter.includes(region)}
                      onChange={() => toggleMultiSelectFilter('region', region)}
                      className="accent-zendesk-green"
                    />
                    <span className="text-sm text-gray-700">{region}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zendesk-green mb-2">
                Director ({directorFilter.length} selected)
              </label>
              <div className="border-2 border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto bg-white">
                <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-zendesk-lime/20 border-b border-gray-200 mb-1 pb-1">
                  <input
                    type="checkbox"
                    checked={directorFilter.length === filterOptions.directors.length && filterOptions.directors.length > 0}
                    onChange={() => toggleSelectAll('director')}
                    className="accent-zendesk-lime"
                  />
                  <span className="text-sm font-bold text-zendesk-green">All</span>
                </label>
                {filterOptions.directors.map(director => (
                  <label key={director} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-zendesk-lime/10">
                    <input
                      type="checkbox"
                      checked={directorFilter.includes(director)}
                      onChange={() => toggleMultiSelectFilter('director', director)}
                      className="accent-zendesk-green"
                    />
                    <span className="text-sm text-gray-700">{director}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zendesk-green mb-2">
                Manager ({managerFilter.length} selected)
              </label>
              <div className="border-2 border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto bg-white">
                <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-zendesk-lime/20 border-b border-gray-200 mb-1 pb-1">
                  <input
                    type="checkbox"
                    checked={managerFilter.length === filterOptions.managers.length && filterOptions.managers.length > 0}
                    onChange={() => toggleSelectAll('manager')}
                    className="accent-zendesk-lime"
                  />
                  <span className="text-sm font-bold text-zendesk-green">All</span>
                </label>
                {filterOptions.managers.map(manager => (
                  <label key={manager} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-zendesk-lime/10">
                    <input
                      type="checkbox"
                      checked={managerFilter.includes(manager)}
                      onChange={() => toggleMultiSelectFilter('manager', manager)}
                      className="accent-zendesk-green"
                    />
                    <span className="text-sm text-gray-700">{manager}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-zendesk-lime">
          <div className="overflow-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-30">
                {/* Section Headers Row */}
                <tr>
                  {sectionSpans.map((section, idx) => {
                    const colspan = section.end - section.start + 1
                    if (!section.name) {
                      // Empty section - render individual column headers without section
                      return actualHeaders.slice(section.start, section.end + 1).map((header, colIdx) => {
                        const actualIdx = section.start + colIdx
                        const shouldFreeze = actualIdx >= 1 && actualIdx <= 4 // Region through AE Name
                        const leftPosition = actualIdx === 1 ? 0 : actualIdx === 2 ? 120 : actualIdx === 3 ? 240 : actualIdx === 4 ? 360 : 0

                        return (
                          <th
                            key={`section-${idx}-${colIdx}`}
                            rowSpan={2}
                            className={`px-2 py-3 text-left text-[11px] font-bold text-zendesk-green uppercase tracking-wider border-r border-gray-200 bg-gray-50 ${shouldFreeze ? 'sticky z-30' : ''}`}
                            style={shouldFreeze ? { left: `${leftPosition}px` } : {}}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort(actualIdx)}>
                                <span>{header}</span>
                                {sortColumn === actualIdx && (
                                  <span className="text-zendesk-lime text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                              <select
                                onChange={(e) => handleColumnFilterChange(actualIdx, e.target.value)}
                                value={columnFilters[actualIdx] || 'All'}
                                className="text-[10px] px-1 py-0.5 bg-white text-zendesk-green rounded border border-gray-300"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getColumnFilterOptions(actualIdx).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          </th>
                        )
                      })
                    }
                    return (
                      <th
                        key={`section-${idx}`}
                        colSpan={colspan}
                        className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider bg-zendesk-green border-r-2 border-zendesk-lime"
                      >
                        {section.name}
                      </th>
                    )
                  })}
                </tr>
                {/* Column Headers Row (only for sections with names) */}
                <tr>
                  {sectionSpans.filter(s => s.name).map((section, idx) => {
                    return actualHeaders.slice(section.start, section.end + 1).map((header, colIdx) => {
                      const actualIdx = section.start + colIdx
                      return (
                        <th
                          key={`header-${idx}-${colIdx}`}
                          className="px-2 py-2 text-left text-[11px] font-medium text-zendesk-green uppercase tracking-wider border-r border-gray-200"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 cursor-pointer hover:bg-zendesk-lime/10 transition-colors" onClick={() => handleSort(actualIdx)}>
                              <span>{header}</span>
                              {sortColumn === actualIdx && (
                                <span className="text-zendesk-lime text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                            <select
                              onChange={(e) => handleColumnFilterChange(actualIdx, e.target.value)}
                              value={columnFilters[actualIdx] || 'All'}
                              className="text-[10px] px-1 py-0.5 bg-white text-zendesk-green rounded border border-gray-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {getColumnFilterOptions(actualIdx).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                      )
                    })
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-zendesk-lime/5 transition-colors">
                    {row.slice(1).map((cell, cellIdx) => {
                      const actualIdx = cellIdx + 1
                      const bgColor = getConditionalColor(actualIdx, cell)
                      const shouldFreeze = actualIdx >= 1 && actualIdx <= 4 // Region through AE Name
                      const leftPosition = actualIdx === 1 ? 0 : actualIdx === 2 ? 120 : actualIdx === 3 ? 240 : actualIdx === 4 ? 360 : 0

                      return (
                        <td
                          key={cellIdx}
                          className={`px-2 py-2 whitespace-nowrap text-[11px] text-gray-900 border-r border-gray-100 ${shouldFreeze ? 'sticky z-10 font-medium shadow-sm' : ''}`}
                          style={shouldFreeze ? { left: `${leftPosition}px`, backgroundColor: bgColor !== 'transparent' ? bgColor : 'white' } : { backgroundColor: bgColor }}
                        >
                          {formatCurrency(cell)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    </AuthWrapper>
  )
}
