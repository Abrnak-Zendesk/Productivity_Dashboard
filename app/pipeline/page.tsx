'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface SheetData {
  headers: string[]
  rows: any[][]
}

export default function PipelineDashboard() {
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
      const pstOffset = -8 * 60
      const nowPST = new Date(now.getTime() + (now.getTimezoneOffset() + pstOffset) * 60000)

      const midnight = new Date(nowPST)
      midnight.setHours(24, 0, 0, 0)
      const msUntilMidnight = midnight.getTime() - nowPST.getTime()

      const timeoutId = setTimeout(() => {
        fetchData()
        scheduleMidnightRefresh()
      }, msUntilMidnight)

      return timeoutId
    }

    const timeoutId = scheduleMidnightRefresh()
    return () => clearTimeout(timeoutId)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pipeline', { cache: 'no-store' })
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

  const columnIndices = useMemo(() => {
    if (!data || data.rows.length === 0) return null

    return {
      region: 0,
      director: 1,
      manager: 2,
      aeName: 3,
      roleType: 4,
      totalPipeline: 6,
      commit: 7,
      mostLikely: 8
    }
  }, [data])

  const sectionSpans = [
    { start: 0, end: 5, name: '' }, // Region through Ramped
    { start: 6, end: 18, name: 'Open Pipeline ARR' },
    { start: 19, end: 31, name: 'Open Pipeline Deals' }
  ]

  const filterOptions = useMemo(() => {
    if (!data || data.rows.length < 2 || !columnIndices) return { regions: [], directors: [], managers: [] }

    const dataRows = data.rows.slice(1)
    const regions = Array.from(new Set(dataRows.map(row => row[columnIndices.region]).filter(v => v)))
    const directors = Array.from(new Set(dataRows.map(row => row[columnIndices.director]).filter(v => v)))
    const managers = Array.from(new Set(dataRows.map(row => row[columnIndices.manager]).filter(v => v)))

    return { regions, directors, managers }
  }, [data, columnIndices])

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

  const getConditionalColor = (columnIndex: number, value: any): string => {
    const filteredData = getFilteredAndSortedData()
    const columnValues = filteredData.map(row => parseValue(row[columnIndex])).filter(v => v > 0)

    if (columnValues.length === 0) return 'transparent'

    const numValue = parseValue(value)
    if (numValue === 0) return 'transparent'

    const min = Math.min(...columnValues)
    const max = Math.max(...columnValues)

    if (min === max) return 'rgb(254, 240, 138)'

    const ratio = (numValue - min) / (max - min)

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
          <p className="text-zendesk-green">No data available.</p>
        </div>
      </div>
    )
  }

  const filteredData = getFilteredAndSortedData()
  const actualHeaders = data.rows[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-zendesk-green shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/zendesk-logo.png" alt="Zendesk Logo" className="h-16 w-auto" />
              <div>
                <h1 className="text-4xl font-bold text-zendesk-lime">Pipeline Dashboard</h1>
                <div className="flex gap-4 mt-2">
                  <Link href="/" className="text-sm text-gray-300 hover:text-zendesk-lime transition-colors">
                    ← Productivity Dashboard
                  </Link>
                </div>
              </div>
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
                <tr>
                  {sectionSpans.map((section, idx) => {
                    const colspan = section.end - section.start + 1
                    if (!section.name) {
                      return actualHeaders.slice(section.start, section.end + 1).map((header, colIdx) => {
                        const actualIdx = section.start + colIdx
                        const shouldFreeze = actualIdx >= 0 && actualIdx <= 3
                        const leftPosition = actualIdx === 0 ? 0 : actualIdx === 1 ? 120 : actualIdx === 2 ? 240 : actualIdx === 3 ? 360 : 0

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
                    {row.map((cell, cellIdx) => {
                      const bgColor = getConditionalColor(cellIdx, cell)
                      const shouldFreeze = cellIdx >= 0 && cellIdx <= 3
                      const leftPosition = cellIdx === 0 ? 0 : cellIdx === 1 ? 120 : cellIdx === 2 ? 240 : cellIdx === 3 ? 360 : 0

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
  )
}
