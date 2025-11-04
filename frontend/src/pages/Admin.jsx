import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Lock, Upload, Check, X, Save } from 'lucide-react';

function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [cvFiles, setCvFiles] = useState({ en: null, de: null });
  const [uploading, setUploading] = useState({ en: false, de: false });
  const [cvStatus, setCvStatus] = useState({ en: false, de: false });

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolio();
      checkCVs();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setAdminToken(password);
    setIsAuthenticated(true);
    setPassword('');
  };

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/portfolio`);
      const data = await response.json();
      setPortfolio(data);
      setFormData({
        name: data.name || '',
        title: data.title || '',
        about_en: data.about_en || '',
        about_de: data.about_de || '',
        skills: data.skills?.join(', ') || '',
        certifications: data.certifications?.join(', ') || '',
        email: data.email || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        location: data.location || ''
      });
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      showMessage('error', 'Failed to load portfolio data');
    }
  };

  const checkCVs = async () => {
    try {
      const [enRes, deRes] = await Promise.all([
        fetch(`${backendUrl}/api/portfolio/cv/check/en`),
        fetch(`${backendUrl}/api/portfolio/cv/check/de`)
      ]);
      const enData = await enRes.json();
      const deData = await deRes.json();
      setCvStatus({ en: enData.exists, de: deData.exists });
    } catch (error) {
      console.error('Failed to check CVs:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSavePortfolio = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        title: formData.title,
        about_en: formData.about_en,
        about_de: formData.about_de,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        certifications: formData.certifications.split(',').map(c => c.trim()).filter(c => c),
        email: formData.email,
        linkedin: formData.linkedin,
        github: formData.github,
        location: formData.location
      };

      const response = await fetch(`${backendUrl}/api/portfolio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showMessage('success', 'Portfolio updated successfully! Redirecting...');
        // Wait 1.5 seconds to show success message, then redirect
        setTimeout(() => {
          navigate('/portfolio');
        }, 1500);
      } else {
        const error = await response.json();
        showMessage('error', error.detail || 'Failed to update portfolio');
      }
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      showMessage('error', 'Failed to update portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (lang, file) => {
    setCvFiles({ ...cvFiles, [lang]: file });
  };

  const handleUploadCV = async (lang) => {
    const file = cvFiles[lang];
    if (!file) {
      showMessage('error', 'Please select a file first');
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      showMessage('error', 'Only PDF files are allowed');
      return;
    }

    setUploading({ ...uploading, [lang]: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${backendUrl}/api/portfolio/cv/upload?language=${lang}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });

      if (response.ok) {
        showMessage('success', `CV (${lang.toUpperCase()}) uploaded successfully!`);
        setCvFiles({ ...cvFiles, [lang]: null });
        checkCVs();
      } else {
        const error = await response.json();
        showMessage('error', error.detail || 'Failed to upload CV');
      }
    } catch (error) {
      console.error('Failed to upload CV:', error);
      showMessage('error', 'Failed to upload CV');
    } finally {
      setUploading({ ...uploading, [lang]: false });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Lock className="mr-2 h-6 w-6 text-blue-600" />
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Default: admin123</p>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Admin</h1>
          <p className="text-gray-600">Manage your portfolio content and CV files</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="mr-2" /> : <X className="mr-2" />}
            {message.text}
          </div>
        )}

        {/* Portfolio Content */}
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle>Portfolio Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePortfolio} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Professional Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="about_en">About Me (English)</Label>
                <Textarea
                  id="about_en"
                  value={formData.about_en}
                  onChange={(e) => setFormData({...formData, about_en: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="about_de">Über mich (German)</Label>
                <Textarea
                  id="about_de"
                  value={formData.about_de}
                  onChange={(e) => setFormData({...formData, about_de: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  rows={3}
                  placeholder="AWS, Docker, Python, React"
                  required
                />
              </div>

              <div>
                <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                <Textarea
                  id="certifications"
                  value={formData.certifications}
                  onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                  rows={2}
                  placeholder="AWS Cloud Engineer, Google Cloud Certified"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    value={formData.github}
                    onChange={(e) => setFormData({...formData, github: e.target.value})}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Portfolio'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>CV Files Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* English CV */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">English CV</h3>
                  {cvStatus.en && (
                    <span className="text-sm text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Uploaded
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('en', e.target.files[0])}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleUploadCV('en')}
                    disabled={!cvFiles.en || uploading.en}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading.en ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>

              {/* German CV */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">German CV (Lebenslauf)</h3>
                  {cvStatus.de && (
                    <span className="text-sm text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Uploaded
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('de', e.target.files[0])}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleUploadCV('de')}
                    disabled={!cvFiles.de || uploading.de}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading.de ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Admin;