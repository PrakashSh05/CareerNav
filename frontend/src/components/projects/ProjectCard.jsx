import { motion } from 'framer-motion';
import { ClockIcon, CodeBracketIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';

const DIFFICULTY_STYLES = {
  Beginner: {
    container: 'bg-[#101820] border border-[#FEE715]/25 hover:border-[#FEE715] hover:shadow-[#FEE715]/15',
    highlight: 'bg-[#151d26] border border-[#FEE715]/35',
    bullet: 'text-[#FEE715]'
  },
  Intermediate: {
    container: 'bg-[#101820] border border-[#FEE715]/25 hover:border-[#FEE715] hover:shadow-[#FEE715]/15',
    highlight: 'bg-[#151d26] border border-[#FEE715]/35',
    bullet: 'text-[#FEE715]'
  },
  Advanced: {
    container: 'bg-[#101820] border border-[#FEE715]/25 hover:border-[#FEE715] hover:shadow-[#FEE715]/15',
    highlight: 'bg-[#151d26] border border-[#FEE715]/35',
    bullet: 'text-[#FEE715]'
  },
  Default: {
    container: 'bg-[#101820] border border-[#FEE715]/25 hover:border-[#FEE715] hover:shadow-[#FEE715]/15',
    highlight: 'bg-[#151d26] border border-[#FEE715]/35',
    bullet: 'text-[#FEE715]'
  }
};

/**
 * ProjectCard component for displaying project recommendations
 */
const ProjectCard = ({ project, userSkills = [], className = '', onViewDetails, ...props }) => {
  const getDifficultyVariant = (difficulty) => {
    const variantMap = {
      'Beginner': 'success',
      'Intermediate': 'warning',
      'Advanced': 'danger'
    };
    return variantMap[difficulty] || 'default';
  };

  const getMatchVariant = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    if (percentage >= 40) return 'primary';
    return 'danger';
  };

  // Check which skills the user has
  const userSkillsLower = userSkills.map(skill => skill.toLowerCase());
  const projectSkillsWithStatus = project.skills?.map(skill => ({
    name: skill,
    hasSkill: userSkillsLower.includes(skill.toLowerCase())
  })) || [];

  const handleViewDetails = () => {
    onViewDetails?.(project);
  };

  const difficultyStyles = DIFFICULTY_STYLES[project.difficulty] || DIFFICULTY_STYLES.Default;

  return (
    <motion.div
      className={`
        rounded-lg p-6
        hover:shadow-lg
        transition-all duration-300
        flex flex-col h-full
        ${difficultyStyles.container}
        ${className}
      `}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge 
                variant={getDifficultyVariant(project.difficulty)} 
                size="xs"
              >
                {project.difficultyIcon} {project.difficulty}
              </Badge>
              {project.skill_match_percentage !== undefined && (
                <Badge 
                  variant={getMatchVariant(project.skill_match_percentage)} 
                  size="xs"
                >
                  {Math.round(project.skill_match_percentage)}% Match
                </Badge>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
              {project.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Target Roles */}
        {project.roles && project.roles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Best Suited For:</h4>
            <div className="flex flex-wrap gap-2">
              {project.roles.slice(0, 3).map((role, index) => (
                <Badge key={index} variant="outline" size="xs">
                  {role}
                </Badge>
              ))}
              {project.roles.length > 3 && (
                <Badge variant="outline" size="xs">
                  +{project.roles.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Project Info */}
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400">
          {project.estimated_time && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{project.estimated_time}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <CodeBracketIcon className="h-4 w-4" />
            <span>{project.skills?.length || 0} Skills</span>
          </div>
        </div>

        {/* Skills */}
        {projectSkillsWithStatus.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Required Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {projectSkillsWithStatus.map((skillInfo, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <Badge 
                    variant={skillInfo.hasSkill ? 'success' : 'outline'} 
                    size="xs"
                    className="flex items-center space-x-1"
                  >
                    {skillInfo.hasSkill ? (
                      <CheckCircleIcon className="h-3 w-3" />
                    ) : (
                      <XCircleIcon className="h-3 w-3" />
                    )}
                    <span>{skillInfo.name}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills Alert */}
        {project.missing_skills && project.missing_skills.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg ${difficultyStyles.highlight}`}>
            <div className="text-yellow-400 text-sm font-medium mb-1">
              Skills to Learn:
            </div>
            <div className="flex flex-wrap gap-1">
              {project.missing_skills.map((skill, index) => (
                <Badge key={index} variant="warning" size="xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Features */}
        {project.features && project.features.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Key Features:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              {project.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className={`${difficultyStyles.bullet} mt-1`}>•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectCard;
