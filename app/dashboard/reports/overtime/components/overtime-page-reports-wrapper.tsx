"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, Printer, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


import type {
  OvertimeReportFilters as OvertimeFilters,
  OvertimeReportData,
  OvertimeFilterOptions,
  OvertimeReportItem,
} from "@/lib/types/overtime-reports-types"
import { exportOvertimeReportsCSV, getOvertimeFilterOptions, getOvertimeReports } from "@/lib/actions/overtime-reports-actions"
import { toast } from "sonner"
import { OvertimeReportSummary } from "./overtime-report-summary"
import { OvertimeReportTable } from "./overtime-report-table"
import { OvertimeReportFilters } from "./overtime-reports-filters"

export default function OvertimeReportsPageWrapper() {

  const [reportData, setReportData] = useState<OvertimeReportData | null>(null)
  const [filterOptions, setFilterOptions] = useState<OvertimeFilterOptions | null>(null)
  const [filters, setFilters] = useState<OvertimeFilters>({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, options] = await Promise.all([
        getOvertimeReports(filters, currentPage, pageSize),
        filterOptions || getOvertimeFilterOptions(),
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

  const handleFiltersChange = (newFilters: OvertimeFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleResetFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleSort = (field: keyof OvertimeReportItem, direction: "asc" | "desc") => {
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
      const csvContent = await exportOvertimeReportsCSV(filters)

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `overtime-reports-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Overtime reports exported successfully.")
    } catch (error) {
      toast.error(`${error}`)
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    const printStyles = `
      <style>
        @media print {
          @page { 
            size: landscape; 
            margin: 0.5in; 
          }
          body { 
            font-size: 12px; 
            font-family: Arial, sans-serif;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 4px; 
            text-align: left; 
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
          }
          .no-print { 
            display: none; 
          }
        }
      </style>
    `

    const printContent = document.querySelector(".print-content")?.innerHTML || ""
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Overtime Reports</title>
            ${printStyles}
          </head>
          <body>
            <h1>Overtime Reports</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
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
          <h1 className="text-3xl font-bold">Overtime Reports</h1>
          <p className="text-muted-foreground">Comprehensive overtime request analytics and reporting</p>
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

          <Button onClick={handlePrint} variant="outline" size="sm" className="no-print bg-transparent">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      {filterOptions && (
        <OvertimeReportFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
          onReset={handleResetFilters}
        />
      )}

      {/* Summary */}
      {reportData && <OvertimeReportSummary summary={reportData.summary} />}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overtime Requests</CardTitle>
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
          <div className="print-content">
            {reportData && reportData.items.length > 0 ? (
              <OvertimeReportTable data={reportData.items} onSort={handleSort} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No overtime requests found matching the current filters.
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
