"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, Printer, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLeaveReports, getFilterOptions, exportLeaveReportsCSV } from "@/lib/actions/reports-actions"
import type { LeaveReportFilters, ReportData, FilterOptions, LeaveReportItem } from "@/lib/types/reports"
import { ReportSummary } from "./leave-reports-summary"
import { ReportTable } from "./leave-reports-table"
import { toast } from "sonner"
import { ReportFilters } from "./leave-reports-filter"

export default function LeaveReportsPageWrapper() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [filters, setFilters] = useState<LeaveReportFilters>({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, options] = await Promise.all([
        getLeaveReports(filters, currentPage, pageSize),
        filterOptions || getFilterOptions(),
      ])
      setReportData(data)
      if (!filterOptions) setFilterOptions(options)
    } catch (error) {
      toast.error(`${error}`)
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, pageSize, filterOptions])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFiltersChange = (newFilters: LeaveReportFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleResetFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleSort = (field: keyof LeaveReportItem, direction: "asc" | "desc") => {
    if (!reportData) return

    const sortedItems = [...reportData.items].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    setReportData({ ...reportData, items: sortedItems })
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const csvContent = await exportLeaveReportsCSV(filters)

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `leave-reports-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Leave Reports exported successfully.")
    } catch (error) {
      toast.error(`${error}`)
    } finally {
      setExporting(false)
    }
  }

  // ✨ --- NEW HELPER FUNCTION TO GENERATE TABLE HTML --- ✨
  const generateTableReportHTML = (data: ReportData): string => {
    const headers = `
      <thead>
        <tr>
          <th>Employee</th>
          <th>Department</th>
          <th>Leave Type</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Days</th>
          <th>Status</th>
        </tr>
      </thead>
    `

    const rows = data.items
      .map((item) => {
        return `
        <tr>
          <td>${item.employeeName || "N/A"}</td>
          <td>${item.department || "N/A"}</td>
          <td>${item.leaveType || "N/A"}</td>
          <td>${new Date(item.startDate).toLocaleDateString()}</td>
          <td>${new Date(item.endDate).toLocaleDateString()}</td>
          <td>${item.dayCount}</td>
          <td>${item.status || "N/A"}</td>
        </tr>
      `
      })
      .join("")

    return `<table>${headers}<tbody>${rows}</tbody></table>`
  }

  // ✨ --- IMPROVED PRINT FUNCTION (TABLE VERSION) --- ✨
  const handlePrint = () => {
    if (!reportData || reportData.items.length === 0) {
      toast.error("No data available to print.")
      return
    }

    const printStyles = `
      <style>
        @media print {
          @page { 
            size: landscape; 
            margin: 0.75in; 
          }
          body { 
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #333;
          }
          .report-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .report-header h2 {
            margin: 0;
            font-size: 16px;
          }
          .report-header p {
            margin: 0;
            font-size: 12px;
          }
          table { 
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 6px 8px;
            text-align: left;
            border: none;
          }
          thead tr {
            border-bottom: 2px solid #000;
          }
          th {
            font-weight: bold;
          }
          tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .no-print { 
            display: none; 
          }
        }
      </style>
    `

    const tableHTML = generateTableReportHTML(reportData)
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Leave Reports</title>
            ${printStyles}
          </head>
          <body>
            <div class="report-header">
              <h2>RD REALTY GROUP - LEAVE & OT MANAGEMENT SYSTEM</h2>
              <p>Leave Report - Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            ${tableHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250);
    }
  }


  const totalPages = reportData ? Math.ceil(reportData.totalCount / pageSize) : 0

  if (loading && !reportData) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Reports</h1>
          <p className="text-muted-foreground">Comprehensive leave request analytics and reporting</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button onClick={handlePrint} variant="outline" size="sm" className="no-print">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      {filterOptions && (
        <ReportFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
          onReset={handleResetFilters}
        />
      )}

      {/* Summary */}
      {reportData && <ReportSummary summary={reportData.summary} />}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Requests</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number.parseInt(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportData && (
                <span className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, reportData.totalCount)} of {reportData.totalCount} results
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* This div is for screen display */}
          <div className="print-content">
            {reportData && reportData.items.length > 0 ? (
              <ReportTable data={reportData.items} onSort={handleSort} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No leave requests found matching the current filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          {reportData && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}