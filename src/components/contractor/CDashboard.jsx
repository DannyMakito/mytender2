import React from 'react';
import { TenderDataTable } from "@/components/TenderDataTable";
import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { IconPlus } from "@tabler/icons-react";

const CDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <SectionCards />
                    <TenderDataTable  />
                  </div>
      </div>
   </div>
  );
};

export default CDashboard;
