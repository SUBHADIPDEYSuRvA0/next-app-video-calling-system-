import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
                <rect x="1" y="6" width="15" height="12" rx="2" ry="2" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">MeetClone</h1>
          <p className="text-gray-400 mt-2">Connect with anyone, anywhere</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Start or join a meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/new-meeting" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">New Meeting</Button>
              </Link>

              <div className="relative">
                <Input placeholder="Enter meeting code" className="bg-gray-700 border-gray-600 text-white pl-4" />
                <Link href="/join" className="absolute right-0 top-0 h-full">
                  <Button variant="ghost" className="h-full text-blue-400 hover:text-blue-300 hover:bg-transparent">
                    Join
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
