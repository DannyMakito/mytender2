
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
import BidTemplateSelector from "@/components/bidder/proposals/BidTemplateSelector"
import BidProposalEditor from "@/components/bidder/proposals/BidProposalEditor"
import TemplateSelector from "@/components/contractor/documents/TemplateSelector"
import TenderDocumentEditor from "@/components/contractor/documents/TenderDocumentEditor"
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
import MyProfile from "@/components/profile/MyProfile"
import { NotificationProvider } from "@/context/NotificationContext"

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Authenticated Routes wrapped in MainLayout */}
            <Route element={<MainLayout />}>
              {/* Shared */}
              <Route path="teams" element={<TeamsPage />} />
              <Route path="notifications" element={<Notifactions />} />
              <Route path="profile" element={<MyProfile />} />

              {/* Contractor Routes */}
              <Route path="cdashboard" element={<CDashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="tender" element={<Tender />} />
              <Route path="tender/:id/bids" element={<TenderBids />} />
              <Route path="cdocuments" element={<CDocuments />} />
              <Route path="cdocuments/templates" element={<TemplateSelector />} />
              <Route path="cdocuments/new" element={<TenderDocumentEditor />} />
              <Route path="cdocuments/edit/:id" element={<TenderDocumentEditor />} />

              {/* Bidder Routes */}
              <Route path="tenders" element={<Tenders />} />
              <Route path="tenders/:id" element={<TenderDetails />} />
              <Route path="bidder-projects" element={<Projects />} />
              <Route path="bdashboard" element={<BDashboard />} />
              <Route path="bdocuments" element={<BDocuments />} />
              <Route path="bdocuments/templates" element={<BidTemplateSelector />} />
              <Route path="bdocuments/new" element={<BidProposalEditor />} />
              <Route path="bdocuments/edit/:id" element={<BidProposalEditor />} />
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
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App