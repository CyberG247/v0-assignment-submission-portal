import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, BookOpen, Settings, Bell, LogOut, Plus } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/auth/login")
  }

  // Get system statistics
  const [{ count: totalUsers }, { count: totalAssignments }, { count: totalSubmissions }, { count: totalSubjects }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("assignments").select("*", { count: "exact", head: true }),
      supabase.from("submissions").select("*", { count: "exact", head: true }),
      supabase.from("subjects").select("*", { count: "exact", head: true }),
    ])

  // Get recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  // Get subjects with assignment counts
  const { data: subjects } = await supabase
    .from("subjects")
    .select(`
      *,
      assignments (id)
    `)
    .order("name")

  // Get user role distribution
  const { data: roleStats } = await supabase
    .from("profiles")
    .select("role")
    .then(({ data }) => {
      const stats = { student: 0, teacher: 0, admin: 0 }
      data?.forEach((user) => {
        if (user.role in stats) {
          stats[user.role as keyof typeof stats]++
        }
      })
      return stats
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5 text-gray-400" />
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
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAssignments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSubmissions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSubjects || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Overview of user roles in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{roleStats?.student || 0}</p>
                <p className="text-sm text-gray-600">Students</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{roleStats?.teacher || 0}</p>
                <p className="text-sm text-gray-600">Teachers</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{roleStats?.admin || 0}</p>
                <p className="text-sm text-gray-600">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </div>
              <Link href="/admin/users">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentUsers && recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={user.role === "admin" ? "default" : user.role === "teacher" ? "secondary" : "outline"}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subjects Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>Manage course subjects</CardDescription>
              </div>
              <Link href="/admin/subjects/create">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {subjects && subjects.length > 0 ? (
                <div className="space-y-4">
                  {subjects.slice(0, 5).map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{subject.name}</h3>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                        <p className="text-xs text-gray-500">{subject.assignments?.length || 0} assignments</p>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/admin/subjects/${subject.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No subjects created yet</p>
                  <Link href="/admin/subjects/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">Create First Subject</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/users">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
                >
                  <Users className="w-6 h-6 mb-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/subjects">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
                >
                  <BookOpen className="w-6 h-6 mb-2" />
                  Manage Subjects
                </Button>
              </Link>
              <Link href="/admin/assignments">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  View Assignments
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
                >
                  <Settings className="w-6 h-6 mb-2" />
                  System Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
