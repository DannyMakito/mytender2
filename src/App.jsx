
import { Button } from "@/components/ui/button"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import HomePage from "@/components/landingpage/HomePage"
import Projects from "@/components/contractor/Projects"
import Tender from "@/components/contractor/Tender"
import Tenders from "@/components/bidder/Tenders"
import TenderDetails from "@/components/bidder/TenderDetials"
import CDashboard from "@/components/contractor/CDashboard"
import ContractorLayout from "@/layouts/ContractorLayout"
import BidderLayout from "./components/bidder/BidderLayout"
import BDashboard from "@/components/bidder/BDashboard"
import CDocuments from "@/components/contractor/CDocuments"
import BDocuments from "@/components/bidder/BDocuments"
import MainLayout from "@/layouts/MainLayout"
import { AuthProvider } from "@/context/AuthContext"
import TenderBids from "@/components/contractor/TenderBids"
import { Toaster } from "sonner"
import Notifactions from "./components/Notifactions"
import Onboarding from "@/components/onboarding/Onboarding"
import TeamsPage from "@/components/teams/TeamsPage"
import ADashboard from "@/components/admin/ADashboard"
import AdminLayout from "@/layouts/AdminLayout"
import UserManagement from "@/components/admin/UserManagement"
import UserProfile from "@/components/admin/UserProfile"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Authenticated Routes wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            {/* Shared */}
            <Route path="teams" element={<TeamsPage />} />
            <Route path="notifications" element={<Notifactions />} />

            {/* Contractor Routes */}
            <Route path="cdashboard" element={<CDashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tender" element={<Tender />} />
            <Route path="tender/:id/bids" element={<TenderBids />} />
            <Route path="cdocuments" element={<CDocuments />} />

            {/* Bidder Routes */}
            <Route path="tenders" element={<Tenders />} />
            <Route path="tenders/:id" element={<TenderDetails />} />
            <Route path="bidder-projects" element={<Projects />} />
            <Route path="bdashboard" element={<BDashboard />} />
            <Route path="bdocuments" element={<BDocuments />} />
            <Route path="bnotifications" element={<Notifactions />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="adashboard" element={<ADashboard />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/users/:id" element={<UserProfile />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App