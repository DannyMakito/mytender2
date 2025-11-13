import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { IconChevronRight } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabase-client";

export function TenderDataTable() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenders = async () => {
      if (!user?.email) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tenders')
          .select('*')
          .eq('posted_by', user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTenders(data || []);
      } catch (error) {
        console.error('Error fetching tenders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, [user?.email]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PP');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { text: 'Open', className: 'bg-green-100 text-green-800' },
      closed: { text: 'Closed', className: 'bg-red-100 text-red-800' },
      draft: { text: 'Draft', className: 'bg-yellow-100 text-yellow-800' },
    };
    
    const statusInfo = statusMap[status?.toLowerCase()] || { text: status || 'Unknown', className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (tenders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tenders found. Create your first tender to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Budget
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Closing Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tenders.map((tender) => (
            <tr key={tender.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{tender.title}</div>
                <div className="text-sm text-gray-500">{tender.province || 'No location specified'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(tender.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tender.budget ? `R ${parseFloat(tender.budget).toLocaleString()}` : 'Not specified'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(tender.closing_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(tender.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => navigate(`/tender/${tender.id}`)}
                  className="text-indigo-600 hover:text-indigo-900 flex items-center"
                >
                  View <IconChevronRight className="ml-1 h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
