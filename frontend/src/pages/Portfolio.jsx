import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Download, Globe, Award, Languages, Mail, Linkedin, Github, MapPin } from 'lucide-react';

function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [cvStatus, setCvStatus] = useState({ en: false, de: false });

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchPortfolio();
    checkCVs();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/portfolio`);
      const data = await response.json();
      setPortfolio(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      setLoading(false);
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

  const downloadCV = (lang) => {
    window.open(`${backendUrl}/api/portfolio/cv/${lang}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Portfolio data not available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className={language === 'en' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              🇬🇧 English
            </Button>
            <Button
              variant={language === 'de' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('de')}
              className={language === 'de' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              🇩🇪 Deutsch
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
              {portfolio.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{portfolio.name}</h1>
            <p className="text-xl text-blue-600 mb-4">{portfolio.title}</p>
            
            {/* Contact Info */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              {portfolio.email && (
                <a href={`mailto:${portfolio.email}`} className="flex items-center hover:text-blue-600">
                  <Mail className="h-4 w-4 mr-1" />
                  {portfolio.email}
                </a>
              )}
              {portfolio.linkedin && (
                <a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600">
                  <Linkedin className="h-4 w-4 mr-1" />
                  LinkedIn
                </a>
              )}
              {portfolio.github && (
                <a href={portfolio.github} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600">
                  <Github className="h-4 w-4 mr-1" />
                  GitHub
                </a>
              )}
              {portfolio.location && (
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {portfolio.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Globe className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'About Me' : 'Über mich'}
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {language === 'en' ? portfolio.about_en : portfolio.about_de}
            </p>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Award className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Skills' : 'Fähigkeiten'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolio.skills.map((skill, index) => (
                <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certifications Section */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Award className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Certifications' : 'Zertifikate'}
              </h2>
            </div>
            <ul className="space-y-2">
              {portfolio.certifications.map((cert, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">{cert}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Languages Section */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Languages className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Languages' : 'Sprachen'}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {portfolio.languages.map((lang, index) => (
                <div key={index} className="text-center">
                  <p className="font-semibold text-gray-900">{lang.name}</p>
                  <p className="text-sm text-gray-600">{lang.level}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CV Download Section */}
        <Card className="shadow-md bg-gradient-to-r from-blue-500 to-blue-600">
          <CardContent className="p-6">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-4">
                {language === 'en' ? 'Download CV' : 'Lebenslauf herunterladen'}
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {cvStatus.en && (
                  <Button
                    onClick={() => downloadCV('en')}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    English Version
                  </Button>
                )}
                {cvStatus.de && (
                  <Button
                    onClick={() => downloadCV('de')}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    German Version
                  </Button>
                )}
                {!cvStatus.en && !cvStatus.de && (
                  <p className="text-white">CV files will be available soon</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Portfolio;