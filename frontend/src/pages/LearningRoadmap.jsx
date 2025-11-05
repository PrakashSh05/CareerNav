import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AcademicCapIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

import { useAuth } from '../hooks/useAuth';
import learningService from '../services/learningService';
import { RESOURCE_TYPES } from '../utils/constants';

import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchInput from '../components/ui/SearchInput';
import FilterDropdown from '../components/ui/FilterDropdown';
import Badge from '../components/ui/Badge';
import SkillLearningPath from '../components/learning/SkillLearningPath';
import ResourceCard from '../components/learning/ResourceCard';

const LearningRoadmap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  // Initialize selected role
  useEffect(() => {
    if (user?.target_roles && user.target_roles.length > 0 && !selectedRole) {
      setSelectedRole(user.target_roles[0]);
    }
  }, [user, selectedRole]);

  // Fetch roadmap when role changes
  useEffect(() => {
    if (selectedRole) {
      fetchRoadmap();
    }
  }, [selectedRole]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const roadmapData = await learningService.getLearningRoadmap({
        include_gap_analysis: true,
        target_role: selectedRole
      });
      
      setRoadmap(roadmapData);
    } catch (err) {
      console.error('Error fetching learning roadmap:', err);
      setError(err.message || 'Failed to load learning roadmap');
    } finally {
      setLoading(false);
    }
  };

  // Filter skill paths based on search and filters
  const filteredSkillPaths = roadmap?.skill_paths?.filter(skillPath => {
    // Search filter
    if (searchQuery && !skillPath.skill.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Missing skills filter
    if (showMissingOnly && !skillPath.is_missing) {
      return false;
    }
    
    // Resource type filter
    if (resourceTypeFilter && skillPath.resources) {
      const hasResourceType = skillPath.resources.some(resource => 
        resource.type === resourceTypeFilter
      );
      if (!hasResourceType) return false;
    }
    
    return true;
  }) || [];

  const resourceTypeOptions = Object.values(RESOURCE_TYPES).map(type => ({
    value: type,
    label: type
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Roadmap</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <motion.button
            onClick={fetchRoadmap}
            className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <AcademicCapIcon className="h-8 w-8 text-accent-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">Learning Roadmap</h1>
                {user?.target_roles && user.target_roles.length > 1 && (
                  <div className="mt-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="bg-primary-900 border border-primary-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      {user.target_roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-800 hover:bg-primary-700 border border-primary-600 rounded-lg text-gray-300 hover:text-white transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </motion.button>
          </div>
          
          <p className="text-gray-400">
            Personalized learning path for <span className="text-accent-500 font-medium">{selectedRole || 'your target role'}</span>
          </p>
        </motion.div>

        {/* Stats Overview */}
        {roadmap && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-primary-800 border border-primary-700 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {roadmap.total_skills - roadmap.missing_skills_count}
                  </p>
                  <p className="text-sm text-gray-400">Skills You Have</p>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-800 border border-primary-700 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-accent-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{roadmap.missing_skills_count}</p>
                  <p className="text-sm text-gray-400">Skills to Learn</p>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-800 border border-primary-700 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <AcademicCapIcon className="h-8 w-8 text-accent-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{roadmap.total_skills}</p>
                  <p className="text-sm text-gray-400">Total Skills</p>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-800 border border-primary-700 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {roadmap.coverage_percentage ? Math.round(roadmap.coverage_percentage) : 0}%
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {roadmap.coverage_percentage ? Math.round(roadmap.coverage_percentage) : 0}%
                  </p>
                  <p className="text-sm text-gray-400">Coverage</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {roadmap?.recommendations && roadmap.recommendations.length > 0 && (
          <motion.div
            className="mb-8 bg-accent-500/10 border border-accent-500/20 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="h-6 w-6 text-accent-500 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-accent-500 mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {roadmap.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-gray-300 flex items-start space-x-2">
                      <span className="text-accent-500 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          className="mb-8 bg-primary-800 border border-primary-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <SearchInput
              placeholder="Search skills..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
            
            <FilterDropdown
              label="Resource Type"
              options={[{ value: '', label: 'All Types' }, ...resourceTypeOptions]}
              value={resourceTypeFilter}
              onChange={setResourceTypeFilter}
            />
            
            <div className="flex items-center space-x-2 pb-3">
              <input
                type="checkbox"
                id="missing-only"
                checked={showMissingOnly}
                onChange={(e) => setShowMissingOnly(e.target.checked)}
                className="w-4 h-4 text-accent-500 bg-primary-700 border-primary-600 rounded focus:ring-accent-500"
              />
              <label htmlFor="missing-only" className="text-sm text-gray-300">
                Show missing skills only
              </label>
            </div>
          </div>
        </motion.div>

        {/* Skill Paths */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Learning Paths ({filteredSkillPaths.length})
            </h2>
            
            {filteredSkillPaths.length !== roadmap?.skill_paths?.length && (
              <Badge variant="outline" size="sm">
                {filteredSkillPaths.length} of {roadmap?.skill_paths?.length} shown
              </Badge>
            )}
          </div>

          <AnimatePresence>
            {filteredSkillPaths.length > 0 ? (
              <div className="space-y-4">
                {filteredSkillPaths.map((skillPath, index) => (
                  <motion.div
                    key={skillPath.skill}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <SkillLearningPath skillPath={skillPath} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Skills Found</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filters to see more results.
                </p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default LearningRoadmap;
