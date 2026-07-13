import React from 'react'
import { Header } from './Header'
import { useIsMobile } from '@/hooks/use-mobile'
import MobileLoginPage from './MobileLoginPage'

import Tenders from '../bidder/Tenders'
import Tender from '../contractor/Tender'
import ContractorLayout from '../../layouts/ContractorLayout'
import BidderLayout from '../bidder/BidderLayout'
import { Hero } from './Hero'
import { Features } from './Features'
import { HowItWorks } from './HowItWorks'
import { CTA } from './CTA'
import { Footer } from './Footer'
const HomePage = () => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileLoginPage />
  }

  return (
    <div>
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  )
}

export default HomePage
