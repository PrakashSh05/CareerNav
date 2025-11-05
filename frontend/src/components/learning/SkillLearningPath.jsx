import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';
import ResourceCard from './ResourceCard';

/**
 * SkillLearningPath component for displaying a skill's learning path
 */
const SkillLearningPath = ({ skillPath, className = '', ...props }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (score) => {
    if (score >= 80) return 'danger';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'primary';
    return 'default';
  };

  const getPriorityLabel = (score) => {
    if (score >= 80) return 'High Priority';
    if (score >= 60) return 'Medium Priority';
    if (score >= 40) return 'Low Priority';
    return 'Optional';
  };

  return (
    <motion.div
      className={`
        bg-primary-900 border border-primary-700 rounded-lg overflow-hidden
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {/* Header */}
      <motion.div
        className="p-6 cursor-pointer hover:bg-primary-800 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.8)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Skill Status Icon */}
            <div className="flex-shrink-0">
              {skillPath.is_missing ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-accent-500" />
              ) : (
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              )}
            </div>

            {/* Skill Info */}
            <div>
              <h3 className="text-xl font-semibold text-white">
                {skillPath.skill}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {skillPath.is_missing && (
                  <Badge variant="warning" size="xs">
                    Missing Skill
                  </Badge>
                )}
                {skillPath.priority_score && (
                  <Badge 
                    variant={getPriorityColor(skillPath.priority_score)} 
                    size="xs"
                  >
                    {getPriorityLabel(skillPath.priority_score)}
                  </Badge>
                )}
                <Badge variant="outline" size="xs">
                  {skillPath.resources?.length || 0} Resources
                </Badge>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </motion.div>
        </div>

        {/* Priority Score Bar */}
        {skillPath.priority_score && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
              <span>Market Demand</span>
              <span>{skillPath.priority_score}%</span>
            </div>
            <div className="w-full bg-primary-800 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${
                  skillPath.priority_score >= 80 ? 'bg-highlight-500' :
                  skillPath.priority_score >= 60 ? 'bg-accent-500' :
                  skillPath.priority_score >= 40 ? 'bg-green-500' : 'bg-gray-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${skillPath.priority_score}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Expandable Resources Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-primary-700 bg-primary-900"
          >
            <div className="p-6">
              {skillPath.resources && skillPath.resources.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white mb-4">
                    Learning Resources
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillPath.resources.map((resource, index) => (
                      <ResourceCard
                        key={`${resource.url}-${index}`}
                        resource={resource}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    No resources available for this skill yet.
                  </div>
                  <p className="text-sm text-gray-500">
                    Check back later or search for resources manually.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SkillLearningPath;
