import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Calendar } from './components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Search, Plus, Building2, User, Calendar as CalendarIcon, Briefcase, Filter, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import './App.css';

const statusColors = {
  'Applied': 'bg-blue-100 text-blue-800',
  'Interviewing': 'bg-yellow-100 text-yellow-800', 
  'Offer': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800'
};

const progressColors = {
  'Not Started': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-orange-100 text-orange-800',
  'Completed': 'bg-green-100 text-green-800'
};

function App() {
  const [applications, setApplications] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, by_status: {} });
  
  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    recruiter_name: '',
    application_date: new Date(),
    status: 'Applied',
    progress: 'Not Started',
    notes: ''
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [searchTerm, statusFilter, progressFilter]);

  const fetchApplications = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (progressFilter) params.append('progress', progressFilter);
      
      const response = await fetch(`${backendUrl}/api/applications?${params}`);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/applications/stats/summary`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          application_date: format(formData.application_date, 'yyyy-MM-dd')
        }),
      });
      
      if (response.ok) {
        setFormData({
          job_title: '',
          company_name: '',
          recruiter_name: '',
          application_date: new Date(),
          status: 'Applied',
          progress: 'Not Started',
          notes: ''
        });
        setIsAddingNew(false);
        fetchApplications();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create application:', error);
    }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      const response = await fetch(`${backendUrl}/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        fetchApplications();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  };

  const deleteApplication = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        const response = await fetch(`${backendUrl}/api/applications/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchApplications();
          fetchStats();
        }
      } catch (error) {
        console.error('Failed to delete application:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Application Tracker</h1>
          <p className="text-gray-600">Stay organized and track your job search progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </CardContent>
          </Card>
          {Object.entries(stats.by_status).map(([status, count]) => (
            <Card key={status} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{status}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by job title, company, or recruiter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Interviewing">Interviewing</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={progressFilter} onValueChange={setProgressFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by Progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Progress</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Application</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="job_title">Job Title *</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="recruiter_name">Recruiter Name</Label>
                    <Input
                      id="recruiter_name"
                      value={formData.recruiter_name}
                      onChange={(e) => setFormData({...formData, recruiter_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Application Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.application_date, "MMM dd, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.application_date}
                          onSelect={(date) => setFormData({...formData, application_date: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="progress">Progress</Label>
                    <Select value={formData.progress} onValueChange={(value) => setFormData({...formData, progress: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Add Application</Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddingNew(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <Card key={app.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {app.job_title}
                    </CardTitle>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Building2 className="mr-1 h-4 w-4" />
                      <span className="text-sm">{app.company_name}</span>
                    </div>
                    {app.recruiter_name && (
                      <div className="flex items-center text-gray-600 mb-2">
                        <User className="mr-1 h-4 w-4" />
                        <span className="text-sm">{app.recruiter_name}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteApplication(app.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="text-sm">
                      Applied: {format(new Date(app.application_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Select value={app.status} onValueChange={(value) => updateApplicationStatus(app.id, value)}>
                      <SelectTrigger className="w-auto">
                        <Badge className={`${statusColors[app.status]} border-0`}>
                          {app.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={`${progressColors[app.progress]} border-0`}>
                      {app.progress}
                    </Badge>
                  </div>

                  {app.notes && (
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm text-gray-700">{app.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || progressFilter 
                ? "Try adjusting your search or filters"
                : "Get started by adding your first job application"
              }
            </p>
            <Button onClick={() => setIsAddingNew(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Application
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;