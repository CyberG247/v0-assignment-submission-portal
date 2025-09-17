import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Users, Clock, CheckCircle, Plus, LogOut } from "lucide-react"
import Link from "next/link"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "teacher") {
    redirect("/auth/login")
  }

  // Get teacher's assignments with submission counts
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      *,
      subjects (name, code),
      submissions (id, status, student_id)
    `)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })

  // Get recent submissions for grading
  const { data: recentSubmissions } = await supabase
    .from("submissions")
    .select(`
      *,
      assignments (title, max_points),
      profiles (full_name)
    `)
    .eq("status", "submitted")
    .in("assignment_id", assignments?.map((a) => a.id) || [])
    .order("submitted_at", { ascending: false })
    .limit(10)

  // Get notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(5)

  // Calculate stats
  const totalAssignments = assignments?.length || 0
  const totalSubmissions = assignments?.reduce((acc, a) => acc + (a.submissions?.length || 0), 0) || 0
  const pendingGrading = recentSubmissions?.length || 0
  const gradedSubmissions =
    assignments?.reduce((acc, a) => acc + (a.submissions?.filter((s: any) => s.status === "graded").length || 0), 0) ||
    0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications Dropdown */}
              <NotificationsDropdown userId={user.id} />
              <span className="text-sm text-gray-700">Welcome, {profile.full_name}</span>
              <form action="/auth/logout" method="post">
                <Button variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Grading</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingGrading}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Graded</p>
                  <p className="text-2xl font-bold text-gray-900">{gradedSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assignments List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Assignments</CardTitle>
                <CardDescription>Manage and track your assignments</CardDescription>
              </div>
              <Link href="/teacher/assignments/create">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Assignment
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.slice(0, 5).map((assignment) => {
                    const submissionCount = assignment.submissions?.length || 0
                    const gradedCount = assignment.submissions?.filter((s: any) => s.status === "graded").length || 0

                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                            <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                              {assignment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.subjects?.name} • Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {submissionCount} submissions • {gradedCount} graded
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/teacher/assignments/${assignment.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Link href={`/teacher/assignments/${assignment.id}/grade`}>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Grade
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No assignments created yet</p>
                  <Link href="/teacher/assignments/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">Create Your First Assignment</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest submissions awaiting grading</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSubmissions && recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{submission.assignments?.title}</h3>
                        <p className="text-sm text-gray-600">by {submission.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/teacher/submissions/${submission.id}/grade`}>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Grade
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions to grade</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
