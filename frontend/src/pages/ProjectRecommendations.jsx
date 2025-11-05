import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CodeBracketIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

import { useAuth } from '../hooks/useAuth';
import projectService from '../services/projectService';
import { DIFFICULTY_LEVELS } from '../utils/constants';

import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchInput from '../components/ui/SearchInput';
import FilterDropdown from '../components/ui/FilterDropdown';
import Badge from '../components/ui/Badge';
import ProjectCard from '../components/projects/ProjectCard';

const ProjectRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [skillFocusFilter, setSkillFocusFilter] = useState([]);
  const [targetRoleFilter, setTargetRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('match'); // match, difficulty, time

  const primaryRole = useMemo(() => user?.target_roles?.[0] || null, [user?.target_roles]);

  // Fetch data on component mount and tab change
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, primaryRole]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activeRole = targetRoleFilter || primaryRole;
      const targetRoleParam = activeRole ? { target_role: activeRole } : {};

      if (activeTab === 'recommendations') {
        const data = await projectService.getProjectRecommendations({
          difficulty: difficultyFilter || undefined,
          skill_focus: skillFocusFilter.length > 0 ? skillFocusFilter : undefined,
          limit: 20,
          ...targetRoleParam
        });
        setRecommendations(data);
        setProjects(data.projects || []);
      } else if (activeTab === 'skill-building') {
        const missingSkills = recommendations?.missing_skills || [];
        const data = await projectService.getSkillBuildingProjects(missingSkills, {
          difficulty: difficultyFilter || undefined,
          limit: 20
        });
        setProjects(data || []);
      } else if (activeTab === 'all') {
        const data = await projectService.getAllProjects({
          difficulty: difficultyFilter || undefined,
          limit: 50
        });
        setProjects(data || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(query);
        const matchesDescription = project.description.toLowerCase().includes(query);
        const matchesSkills = project.skills?.some(skill => 
          skill.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDescription && !matchesSkills) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return (b.skill_match_percentage || 0) - (a.skill_match_percentage || 0);
        case 'difficulty':
          const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'time':
          // Sort by estimated time (assuming format like "1-2 weeks")
          const getTimeValue = (timeStr) => {
            if (!timeStr) return 0;
            const match = timeStr.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          return getTimeValue(a.estimated_time) - getTimeValue(b.estimated_time);
        default:
          return 0;
      }
    });

  const difficultyOptions = Object.values(DIFFICULTY_LEVELS).map(level => ({
    value: level,
    label: level
  }));

  const sortOptions = [
    { value: 'match', label: 'Best Match' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'time', label: 'Time Required' }
  ];

  const targetRoleOptions = useMemo(() => {
    const roles = user?.target_roles || [];
    if (roles.length === 0) return [{ value: '', label: 'All Roles' }];
    return [{ value: '', label: 'All Roles' }, ...roles.map(role => ({ value: role, label: role }))];
  }, [user?.target_roles]);

  const handleProjectDetails = (project) => {
    // This could open a modal or navigate to a detail page
    console.log('View project details:', project);
  };

  const handleApplyFilters = () => {
    fetchProjects();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

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
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Projects</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <motion.button
            onClick={fetchProjects}
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
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <CodeBracketIcon className="h-8 w-8 text-accent-400" />
              <h1 className="text-3xl font-bold text-white">Project Recommendations</h1>
            </div>
            <motion.button
              onClick={handleBackToDashboard}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-gray-200 border border-primary-700 hover:border-accent-500/50 hover:text-white hover:bg-primary-900 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </motion.button>
          </div>
          <p className="text-gray-400">
            Discover projects tailored to your journey as a {primaryRole || 'developer'}
          </p>
        </motion.div>

        {/* Recommendations Summary */}
        {activeTab === 'recommendations' && recommendations?.recommendations && (
          <motion.div
            className="mb-8 bg-accent-500/10 border border-accent-500/20 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="h-6 w-6 text-accent-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-accent-400 mb-2">Personalized Recommendations</h3>
                <ul className="space-y-2">
                  {recommendations.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-gray-300 flex items-start space-x-2">
                      <span className="text-accent-400 mt-1">•</span>
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
          className="mb-8 bg-primary-900 border border-primary-700 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Filters & Search</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
            <SearchInput
              placeholder="Search projects..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="lg:col-span-2"
            />
            
            <FilterDropdown
              label="Difficulty"
              options={[{ value: '', label: 'All Levels' }, ...difficultyOptions]}
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              className="lg:col-span-1"
            />

            <FilterDropdown
              label="Target Role"
              options={targetRoleOptions}
              value={targetRoleFilter}
              onChange={setTargetRoleFilter}
              className="lg:col-span-1"
            />

            <FilterDropdown
              label="Sort By"
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              className="lg:col-span-1"
            />

            <motion.button
              onClick={handleApplyFilters}
              className="w-full px-4 py-3 bg-accent-500 hover:bg-accent-600 text-primary-950 rounded-lg font-semibold lg:col-span-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Apply Filters
            </motion.button>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'recommendations' && 'Recommended Projects'}
              {activeTab === 'skill-building' && 'Skill Building Projects'}
              {activeTab === 'all' && 'All Projects'}
              {' '}({filteredAndSortedProjects.length})
            </h2>
            
            {filteredAndSortedProjects.length !== projects.length && (
              <Badge variant="outline" size="sm">
                {filteredAndSortedProjects.length} of {projects.length} shown
              </Badge>
            )}
          </div>

          <AnimatePresence>
            {filteredAndSortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <ProjectCard
                      project={project}
                      userSkills={user?.skills || []}
                      onViewDetails={handleProjectDetails}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
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

export default ProjectRecommendations;
