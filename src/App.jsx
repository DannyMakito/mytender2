
import { Button } from "@/components/ui/button"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import HomePage from "@/components/landingpage/HomePage"
import Projects from "@/components/contractor/Projects"
import Tender from "@/components/contractor/Tender"
import Tenders from "@/components/bidder/Tenders"
import CDashboard from "@/components/contractor/CDashboard"
import ContractorLayout from "@/layouts/ContractorLayout"
import BidderLayout from "./components/bidder/BidderLayout"
import BDashboard from "@/components/bidder/BDashboard"
import CDocuments from "@/components/contractor/CDocuments"
import BDocuments from "@/components/bidder/BDocuments"
import { AuthProvider } from "@/context/AuthContext"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Contractor routes rendered inside ContractorLayout so sidebar/header persist */}
          <Route path="/" element={<ContractorLayout />}>
            <Route path="cdashboard" element={<CDashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tender" element={<Tender />} />
            <Route path="cdocuments" element={<CDocuments />} />
          </Route>

          {/* Bidder routes */}
          <Route path="/" element={<BidderLayout />}>
            <Route path="tenders" element={<Tenders />} />
            <Route path="bdashboard" element={<BDashboard />} />
            <Route path="bdocuments" element={<BDocuments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App