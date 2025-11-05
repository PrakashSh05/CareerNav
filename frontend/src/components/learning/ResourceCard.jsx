import { motion } from 'framer-motion';
import { ArrowTopRightOnSquareIcon, BookOpenIcon, VideoCameraIcon, AcademicCapIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';

/**
 * ResourceCard component for displaying learning resources
 */
const ResourceCard = ({ resource, className = '', ...props }) => {
  const getResourceIcon = (type) => {
    const iconMap = {
      'Documentation': DocumentTextIcon,
      'Video': VideoCameraIcon,
      'Course': AcademicCapIcon,
      'Book': BookOpenIcon
    };
    return iconMap[type] || DocumentTextIcon;
  };

  const getResourceColor = (type) => {
    const colorMap = {
      'Documentation': 'text-blue-400',
      'Video': 'text-red-400',
      'Course': 'text-purple-400',
      'Book': 'text-green-400'
    };
    return colorMap[type] || 'text-gray-400';
  };

  const IconComponent = getResourceIcon(resource.type);
  const iconColor = getResourceColor(resource.type);

  const handleClick = () => {
    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      className={`
        bg-primary-900 border border-primary-700 rounded-xl p-4
        hover:border-accent-500/40 transition-all duration-200
        ${className}
      `}
      whileHover={{ y: -4, backgroundColor: 'rgba(31, 41, 55, 0.9)' }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-gray-700 rounded-lg ${iconColor}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <Badge variant="outline" size="xs">
              {resource.displayType || resource.type}
            </Badge>
          </div>
        </div>
        
        {resource.isExternal && (
          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
        {resource.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
        {resource.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {resource.domain && (
          <span className="text-xs text-gray-500">
            {resource.domain}
          </span>
        )}
        
        <motion.button
          className="text-teal-400 hover:text-teal-300 text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          View Resource →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ResourceCard;
