"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, FileText, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function GradeSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const [submissionId, setSubmissionId] = useState<string>("")
  const [submission, setSubmission] = useState<any>(null)
  const [grade, setGrade] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const router = useRouter()

  // Load submission data
  useState(() => {
    const loadSubmission = async () => {
      const resolvedParams = await params
      setSubmissionId(resolvedParams.id)

      const supabase = createClient()
      const { data: submissionData, error } = await supabase
        .from("submissions")
        .select(`
          *,
          assignments (title, max_points, subjects (name, code)),
          profiles (full_name, email)
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (error || !submissionData) {
        router.push("/teacher/dashboard")
        return
      }

      setSubmission(submissionData)
      setGrade(submissionData.grade?.toString() || "")
      setFeedback(submissionData.feedback || "")
      setIsPageLoading(false)
    }

    loadSubmission()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const gradeValue = Number.parseInt(grade)
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > submission.assignments.max_points) {
        throw new Error(`Grade must be between 0 and ${submission.assignments.max_points}`)
      }

      // Update submission with grade and feedback
      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          grade: gradeValue,
          feedback: feedback.trim(),
          status: "graded",
          graded_at: new Date().toISOString(),
          graded_by: user.id,
        })
        .eq("id", submissionId)

      if (updateError) {
        throw updateError
      }

      // Create notification for student
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: submission.student_id,
        title: "Assignment Graded",
        message: `Your assignment "${submission.assignments.title}" has been graded`,
        type: "assignment_graded",
      })

      if (notificationError) {
        console.error("Failed to create notification:", notificationError)
      }

      router.push("/teacher/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to grade submission")
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

  if (!submission) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/teacher/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Submission Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{submission.assignments.title}</CardTitle>
            <CardDescription>
              {submission.assignments.subjects?.name} • Submitted by {submission.profiles.full_name} on{" "}
              {new Date(submission.submitted_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">{submission.file_name}</p>
                  <p className="text-sm text-gray-600">{(submission.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grading Form */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Submission</CardTitle>
            <CardDescription>Provide a grade and feedback for this submission</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade (out of {submission.assignments.max_points})</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max={submission.assignments.max_points}
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder={`0 - ${submission.assignments.max_points}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Student</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{submission.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">{submission.profiles.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide constructive feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? "Saving Grade..." : "Save Grade"}
                </Button>
                <Link href="/teacher/dashboard">
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
