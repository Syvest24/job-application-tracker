import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Search, Plus, Building2, User, Calendar as CalendarIcon, Briefcase, Edit2, Trash2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { format } from 'date-fns';

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

function JobTracker() {
  const [applications, setApplications] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [editingApp, setEditingApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, by_status: {} });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const itemsPerPage = 20;
  
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
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [debouncedSearch, statusFilter, progressFilter, currentPage]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (progressFilter && progressFilter !== 'all') params.append('progress', progressFilter);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await fetch(`${backendUrl}/api/applications?${params}`);
      const data = await response.json();
      
      setApplications(data.applications || []);
      setTotalPages(data.total_pages || 1);
      setTotalApplications(data.total || 0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setLoading(false);
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
      const url = editingApp 
        ? `${backendUrl}/api/applications/${editingApp.id}`
        : `${backendUrl}/api/applications`;
      
      const method = editingApp ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          application_date: format(formData.application_date, 'yyyy-MM-dd')
        }),
      });
      
      if (response.ok) {
        resetForm();
        fetchApplications();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to save application:', error);
    }
  };

  const resetForm = () => {
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
    setEditingApp(null);
  };

  const handleAddClick = () => {
    if (isAuthenticated) {
      setIsAddingNew(true);
    } else {
      setShowAuthDialog(true);
    }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    // Simple client-side check - password should match backend ADMIN_PASSWORD
    if (adminPassword) {
      setIsAuthenticated(true);
      setShowAuthDialog(false);
      setIsAddingNew(true);
      setAdminPassword('');
      setAuthError('');
      // Store in sessionStorage to persist during session
      sessionStorage.setItem('jobTrackerAuth', 'true');
    } else {
      setAuthError('Please enter password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('jobTrackerAuth');
  };

  // Check if already authenticated in this session
  useEffect(() => {
    const auth = sessionStorage.getItem('jobTrackerAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleEdit = (app) => {
    setFormData({
      job_title: app.job_title,
      company_name: app.company_name,
      recruiter_name: app.recruiter_name || '',
      application_date: new Date(app.application_date),
      status: app.status,
      progress: app.progress,
      notes: app.notes || ''
    });
    setEditingApp(app);
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
          if (applications.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            fetchApplications();
          }
          fetchStats();
        }
      } catch (error) {
        console.error('Failed to delete application:', error);
      }
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Application Tracker</h1>
          <p className="text-gray-600">Stay organized and track your job search progress</p>
        </div>

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
                <SelectItem value="all">All Statuses</SelectItem>
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
                <SelectItem value="all">All Progress</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddingNew || editingApp !== null} onOpenChange={(open) => {
              if (!open) resetForm();
              else setIsAddingNew(true);
            }}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingApp ? 'Edit Application' : 'Add New Application'}</DialogTitle>
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
                    <Button type="submit" className="flex-1">
                      {editingApp ? 'Update Application' : 'Add Application'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(app)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      title="Edit application"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApplication(app.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
              {debouncedSearch || statusFilter || progressFilter 
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

        {totalPages > 1 && applications.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalApplications)} of {totalApplications} applications
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(1)}
                        className="w-10"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="px-2 py-1">...</span>}
                    </>
                  )}
                  
                  {getPageNumbers().map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className={`w-10 ${currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 py-1">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        className="w-10"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobTracker;