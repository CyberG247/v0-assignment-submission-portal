"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SubmitAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const [assignmentId, setAssignmentId] = useState<string>("")
  const [assignment, setAssignment] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const router = useRouter()

  // Load assignment data
  useState(() => {
    const loadAssignment = async () => {
      const resolvedParams = await params
      setAssignmentId(resolvedParams.id)

      const supabase = createClient()
      const { data: assignmentData, error } = await supabase
        .from("assignments")
        .select(`
          *,
          subjects (name, code)
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (error || !assignmentData) {
        router.push("/student/dashboard")
        return
      }

      setAssignment(assignmentData)
      setIsPageLoading(false)
    }

    loadAssignment()
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Not authenticated")
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${assignmentId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("submissions").upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("submissions").getPublicUrl(fileName)

      // Create submission record
      const { error: submissionError } = await supabase.from("submissions").insert({
        assignment_id: assignmentId,
        student_id: user.id,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        status: "submitted",
      })

      if (submissionError) {
        throw submissionError
      }

      // Create notification for teacher
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: assignment.teacher_id,
        title: "New Assignment Submission",
        message: `A student has submitted ${assignment.title}`,
        type: "new_assignment",
      })

      if (notificationError) {
        console.error("Failed to create notification:", notificationError)
      }

      router.push(`/student/assignments/${assignmentId}`)
    } catch (error: any) {
      setError(error.message || "Failed to submit assignment")
    } finally {
      setIsLoading(false)
    }
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return null
  }

  const isOverdue = new Date(assignment.due_date) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href={`/student/assignments/${assignmentId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assignment Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>
              {assignment.subjects?.name} ({assignment.subjects?.code}) • Due:{" "}
              {new Date(assignment.due_date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Overdue Warning */}
        {isOverdue && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              This assignment is overdue. Late submissions may receive reduced points.
            </AlertDescription>
          </Alert>
        )}

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Assignment</CardTitle>
            <CardDescription>Upload your completed assignment file</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file">Assignment File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, TXT, ZIP files up to 10MB</p>
                  </label>
                </div>

                {file && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button type="submit" disabled={!file || isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Submitting..." : "Submit Assignment"}
                </Button>
                <Link href={`/student/assignments/${assignmentId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
