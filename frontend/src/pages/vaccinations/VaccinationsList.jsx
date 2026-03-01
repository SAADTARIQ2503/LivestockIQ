import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaccinations } from '@/hooks/useVaccinations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Syringe, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

/**
 * Vaccinations List Page
 * Shows all vaccination schedules with filters
 */
export default function VaccinationsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // all, upcoming, completed, overdue
  
  const { 
    schedules, 
    isLoadingSchedules, 
    upcoming,
    overdue,
    deleteSchedule, 
    markCompleted,
    isDeleting,
    isMarkingCompleted 
  } = useVaccinations();

  /**
   * Get filtered schedules based on active tab
   */
  const getFilteredSchedules = () => {
    const schedulesList = Array.isArray(schedules) ? schedules : (schedules?.results || []);
    
    switch (activeTab) {
      case 'upcoming':
        return schedulesList.filter(s => !s.is_completed && new Date(s.schedule_date) >= new Date());
      case 'completed':
        return schedulesList.filter(s => s.is_completed);
      case 'overdue':
        return schedulesList.filter(s => !s.is_completed && new Date(s.schedule_date) < new Date());
      default:
        return schedulesList;
    }
  };

  const filteredSchedules = getFilteredSchedules();

  /**
   * Handle delete schedule
   */
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(id);
    }
  };

  /**
   * Handle mark as completed
   */
  const handleComplete = (id) => {
    if (window.confirm('Mark this vaccination as completed?')) {
      markCompleted(id);
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (schedule) => {
    if (schedule.is_completed) {
      return <Badge variant="success">Completed</Badge>;
    }
    
    const scheduleDate = new Date(schedule.schedule_date);
    const today = new Date();
    
    if (scheduleDate < today) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    return <Badge variant="warning">Pending</Badge>;
  };

  if (isLoadingSchedules) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vaccinations</h1>
          <p className="text-gray-600 mt-1">Manage vaccination schedules</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/vaccinations/recommended')}
          >
            View Recommended
          </Button>
          <Button onClick={() => navigate('/vaccinations/schedule')} className="flex items-center gap-2">
            <Plus size={20} />
            Schedule Vaccination
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Schedules</p>
                <p className="text-2xl font-bold">{schedules?.length || schedules?.results?.length || 0}</p>
              </div>
              <Calendar className="text-primary" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {upcoming?.length || upcoming?.results?.length || 0}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredSchedules.filter(s => s.is_completed).length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {overdue?.length || overdue?.results?.length || 0}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'all', label: 'All Schedules' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'overdue', label: 'Overdue' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Schedules List */}
      {filteredSchedules && filteredSchedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Syringe className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{schedule.vaccine_name}</h3>
                      <p className="text-sm text-gray-600">
                        {schedule.is_group ? 'Group' : `Animal #${schedule.animal}`}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(schedule)}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(schedule.schedule_date)}</span>
                  </div>
                  {schedule.notes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-900 mt-1">{schedule.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!schedule.is_completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComplete(schedule.id)}
                      disabled={isMarkingCompleted}
                      className="flex-1"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(schedule.id)}
                    disabled={isDeleting}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Syringe className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No schedules found</h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'all' 
                ? 'Get started by scheduling your first vaccination'
                : `No ${activeTab} vaccinations at the moment`
              }
            </p>
            <Button onClick={() => navigate('/vaccinations/schedule')}>
              <Plus size={20} className="mr-2" />
              Schedule Vaccination
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
