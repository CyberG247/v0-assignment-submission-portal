import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Shield, Bell } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Digital Assignment Portal</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform for managing assignments, submissions, and grading. Streamline your educational
            workflow with our intuitive interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Assignment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, distribute, and track assignments with ease. Set deadlines and manage submissions efficiently.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Student Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Students can view assignments, submit work, and track their progress in one centralized location.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Teacher Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Grade submissions, provide feedback, and monitor class performance with comprehensive tools.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Bell className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Smart Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Stay updated with real-time notifications for deadlines, submissions, and grade updates.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Role-based Access */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Choose Your Role</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-blue-600">Student</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Access assignments, submit work, and track your academic progress.</p>
                <Button asChild className="w-full">
                  <Link href="/auth/register?role=student">Join as Student</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-green-600">Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Create assignments, grade submissions, and manage your classes.</p>
                <Button asChild className="w-full">
                  <Link href="/auth/register?role=teacher">Join as Teacher</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-purple-600">Administrator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Manage users, oversee system operations, and configure settings.</p>
                <Button asChild className="w-full">
                  <Link href="/auth/register?role=admin">Join as Admin</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
