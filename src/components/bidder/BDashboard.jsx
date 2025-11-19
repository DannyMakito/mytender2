import React from 'react'
import data from "./data.json"
import { BidderDataTable } from "@/components/bdata-table"
import { SectionCards } from "@/components/section-cards"

const BDashboard = () => {
  return (
     <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <SectionCards />
                  <BidderDataTable data={data} />
                </div>
    </div>
 </div>
  )
}

export default BDashboard
