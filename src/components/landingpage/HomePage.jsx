import React from 'react'
import { Header } from './Header'

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
