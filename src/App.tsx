/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Calendar, 
  Users, 
  Briefcase, 
  AlertCircle,
  Filter,
  ChevronRight,
  Loader2,
  Clock,
  Building2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobCircular, JobCategory } from './types';
import { fetchLatestCirculars } from './services/geminiService';

const CATEGORIES: JobCategory[] = [
  'Engineering',
  'Power & Energy',
  'Transportation',
  'Ports',
  'Urban Development',
  'Finance'
];

export default function App() {
  const [circulars, setCirculars] = useState<JobCircular[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [viewingJob, setViewingJob] = useState<JobCircular | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLatestCirculars();
      setCirculars(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCirculars = useMemo(() => {
    return circulars.filter(job => {
      const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
      const matchesSearch = 
        job.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.postName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.department?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [circulars, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Briefcase className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">BD Job Circular Tracker</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Expert Career Coordinator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated at {lastUpdated}
              </span>
            )}
            <button 
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh Circulars
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by organization, post, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <div className="md:col-span-4">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {loading && circulars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
              <p className="text-lg font-medium">Scanning official websites for circulars...</p>
              <p className="text-sm">This may take a moment as we gather the latest data.</p>
            </div>
          ) : filteredCirculars.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredCirculars.map((job) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                  >
                    {job.isUrgent && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    )}
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            job.isUrgent ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {job.category}
                          </span>
                          {job.isUrgent && (
                            <span className="flex items-center gap-1 text-red-600 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              Urgent
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                          {job.postName}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" />
                            <span className="font-semibold text-gray-700">{job.organization}</span>
                            {job.department && <span className="text-gray-400">({job.department})</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>{job.vacancies} Vacancies</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Requirements
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2">{job.requirements}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Deadline
                            </h4>
                            <p className={`text-xs font-bold ${job.isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
                              {job.deadline}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[160px]">
                        <a 
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => setViewingJob(job)}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-3xl py-20 flex flex-col items-center justify-center text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No circulars found matching your criteria</p>
              <p className="text-sm">Try adjusting your search or category filter</p>
              <button 
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-4 text-emerald-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {viewingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingJob(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 mb-2 inline-block">
                      {viewingJob.category}
                    </span>
                    <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {viewingJob.postName}
                    </h2>
                    <p className="text-lg text-emerald-600 font-semibold">{viewingJob.organization}</p>
                  </div>
                  <button 
                    onClick={() => setViewingJob(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <AlertCircle className="w-6 h-6 text-gray-400 rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400">Vacancies</p>
                      <p className="text-sm font-bold text-gray-900">{viewingJob.vacancies}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400">Deadline</p>
                      <p className="text-sm font-bold text-gray-900">{viewingJob.deadline}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Educational Requirements
                    </h4>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {viewingJob.requirements}
                      </p>
                    </div>
                  </section>

                  {viewingJob.documents && viewingJob.documents.length > 0 && (
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                        Key Documents & Requirements
                      </h4>
                      <ul className="grid grid-cols-1 gap-2">
                        {viewingJob.documents.map((doc, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <a 
                  href={viewingJob.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Apply on Official Website
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => setViewingJob(null)}
                  className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            © {new Date().getFullYear()} BD Job Circular Tracker. All data sourced from official government websites.
          </p>
          <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            <span>Engineering</span>
            <span>•</span>
            <span>Power</span>
            <span>•</span>
            <span>Transportation</span>
            <span>•</span>
            <span>Finance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
