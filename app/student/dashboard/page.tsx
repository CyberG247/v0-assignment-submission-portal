import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, Upload, LogOut } from "lucide-react"
import Link from "next/link"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

export default async function StudentDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "student") {
    redirect("/auth/login")
  }

  // Get assignments with submissions
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      *,
      subjects (name, code),
      submissions (id, status, grade, submitted_at)
    `)
    .eq("status", "active")
    .order("due_date", { ascending: true })

  // Get recent notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(5)

  const getStatusBadge = (assignment: any) => {
    const submission = assignment.submissions?.[0]
    const now = new Date()
    const dueDate = new Date(assignment.due_date)

    if (submission) {
      if (submission.status === "graded") {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Graded
          </Badge>
        )
      }
      return <Badge variant="secondary">Submitted</Badge>
    }

    if (dueDate < now) {
      return <Badge variant="destructive">Overdue</Badge>
    }

    const timeDiff = dueDate.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    if (daysDiff <= 1) {
      return (
        <Badge variant="destructive" className="bg-orange-100 text-orange-800">
          Due Soon
        </Badge>
      )
    }

    return <Badge variant="outline">Pending</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">Assignment Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
                  <p className="text-2xl font-bold text-gray-900">{assignments?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Upload className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments?.filter((a) => a.submissions?.length > 0).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments?.filter((a) => !a.submissions?.length).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Graded</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments?.filter((a) => a.submissions?.[0]?.status === "graded").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assignments</CardTitle>
            <CardDescription>View and submit your assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        {getStatusBadge(assignment)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {assignment.subjects?.name} ({assignment.subjects?.code})
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                        <div>Max Points: {assignment.max_points}</div>
                        {assignment.submissions?.[0]?.grade && (
                          <div className="text-green-600 font-medium">
                            Grade: {assignment.submissions[0].grade}/{assignment.max_points}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/student/assignments/${assignment.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {!assignment.submissions?.length && (
                        <Link href={`/student/assignments/${assignment.id}/submit`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Submit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assignments available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
