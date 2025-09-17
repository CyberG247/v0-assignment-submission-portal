import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get assignment details with submission
  const { data: assignment } = await supabase
    .from("assignments")
    .select(`
      *,
      subjects (name, code),
      submissions (*, profiles (full_name))
    `)
    .eq("id", id)
    .single()

  if (!assignment) {
    redirect("/student/dashboard")
  }

  const submission = assignment.submissions?.find((s: any) => s.student_id === user.id)
  const isOverdue = new Date(assignment.due_date) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/student/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assignment Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {assignment.subjects?.name} ({assignment.subjects?.code})
                </CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {submission ? (
                  submission.status === "graded" ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Graded: {submission.grade}/{assignment.max_points}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Submitted</Badge>
                  )
                ) : isOverdue ? (
                  <Badge variant="destructive">Overdue</Badge>
                ) : (
                  <Badge variant="outline">Not Submitted</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(assignment.due_date).toLocaleDateString()} at{" "}
                    {new Date(assignment.due_date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Max Points</p>
                  <p className="text-sm text-gray-600">{assignment.max_points} points</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-gray-600">{assignment.status}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium mb-3">Assignment Description</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Section */}
        {submission ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
              <CardDescription>
                Submitted on {new Date(submission.submitted_at).toLocaleDateString()} at{" "}
                {new Date(submission.submitted_at).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{submission.file_name}</p>
                      <p className="text-sm text-gray-600">{(submission.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                {submission.status === "graded" && (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Grade</p>
                        <p className="text-2xl font-bold text-green-600">
                          {submission.grade}/{assignment.max_points}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Graded On</p>
                        <p className="text-sm">{new Date(submission.graded_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {submission.feedback && (
                      <div>
                        <h4 className="font-medium mb-2">Teacher Feedback</h4>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Submit Assignment</CardTitle>
              <CardDescription>
                {isOverdue
                  ? "This assignment is overdue, but you can still submit it."
                  : "Upload your assignment file to submit."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Ready to submit your work?</p>
                <Link href={`/student/assignments/${assignment.id}/submit`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Submit Assignment</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
