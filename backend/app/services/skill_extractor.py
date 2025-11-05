import re
import logging
from typing import List, Set, Optional, Dict
from functools import lru_cache
import spacy
from spacy.lang.en import English

logger = logging.getLogger(__name__)


class SkillExtractor:
    """
    spaCy-based skill extraction service for job descriptions.
    Implements singleton pattern to avoid reloading the spaCy model multiple times.
    
    IMPORTANT USAGE NOTE (Updated Oct 2025):
    ========================================
    This service contains spaCy NLP capabilities for extracting skills from text,
    but it is INTENTIONALLY NOT USED for job skill extraction in production.
    
    Why spaCy is NOT used for job data:
    - TheirStack API provides clean, curated 'technology_slugs' which are more accurate
    - Text extraction from job descriptions produces too much noise (221 items vs 7-15 clean items)
    - The map_technology_slugs() method is used instead for job collection
    
    Where spaCy CAN be used in the future:
    - Resume parsing: Extract skills from uploaded resumes
    - User profile analysis: Parse free-text skill descriptions
    - Learning content matching: Extract topics from course descriptions
    - Advanced search: NLP-based job search enhancements
    
    Current Status:
    - spaCy is installed and functional (en_core_web_sm model)
    - extract_skills() method exists but is NOT called by job_collection_service
    - map_technology_slugs() is the primary method used for job data
    """
    
    _instance = None
    _nlp = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SkillExtractor, cls).__new__(cls)
            cls._instance._initialize_nlp()
        return cls._instance
    
    def _initialize_nlp(self):
        """Initialize the spaCy model once."""
        try:
            # Try to load the full English model
            self._nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy en_core_web_sm model successfully")
        except OSError:
            logger.warning("en_core_web_sm model not found, using basic English model")
            # Fallback to basic English model
            self._nlp = English()
            # Add basic components
            self._nlp.add_pipe("sentencizer")
            # Try to add tagger if available
            try:
                if 'tagger' not in self._nlp.pipe_names:
                    self._nlp.add_pipe('tagger')
            except Exception as e:
                logger.warning(f"Could not add tagger to basic model: {e}")
    
    # Predefined skill categories for fallback keyword matching
    PROGRAMMING_LANGUAGES = {
        'python', 'java', 'javascript', 'typescript', 'c++', 'cpp', 'c#', 'csharp', 'php', 'ruby', 'go', 'rust',
        'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'bash', 'powershell',
        'perl', 'lua', 'dart', 'objective-c', 'assembly', 'cobol', 'fortran', 'haskell',
        'clojure', 'erlang', 'elixir', 'f#', 'groovy', 'julia', 'racket', 'scheme'
    }
    
    FRAMEWORKS_LIBRARIES = {
        'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'express', 'nodejs', 'spring',
        'laravel', 'rails', 'asp.net', 'aspnet', '.net', 'dotnet', 'jquery', 'bootstrap', 'tailwind', 'redux',
        'vuex', 'rxjs', 'lodash', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn',
        'keras', 'opencv', 'matplotlib', 'seaborn', 'plotly', 'streamlit', 'gradio',
        'hibernate', 'mybatis', 'spring boot', 'next.js', 'nuxt.js', 'gatsby', 'svelte',
        'ember', 'backbone', 'meteor', 'electron', 'react native', 'flutter', 'xamarin',
        'ionic', 'cordova', 'phonegap', 'nestjs', 'axios', 'enzyme', 'jest', 'jasmine',
        'karma', 'casperjs', 'cypress', 'selenium', 'playwright', 'postman', 'pytest',
        'junit', 'gradle', 'maven', 'sass', 'serverless', 'celery', 'sidekiq', 'rabbitmq',
        'kafka', 'phrase', 'greenhouse', 'lever', 'confluence', 'jira', 'workday',
        'versionone', 'solidworks', 'sap', 'unity', 'databricks', 'delta lake', 'spark',
        'superset', 'grafana', 'kibana', 'd3', 'mabl', 'netsuite', 'forge', 'vast',
    }
    
    DATABASES = {
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle',
        'sql server', 'sqlserver', 'cassandra', 'dynamodb', 'firebase', 'couchdb', 'neo4j', 'influxdb',
        'clickhouse', 'snowflake', 'bigquery', 'redshift', 'hbase', 'couchbase', 'riak',
        'memcached', 'etcd', 'consul', 'vault'
    }
    
    CLOUD_PLATFORMS = {
        'aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'microsoft azure',
        'digitalocean', 'heroku', 'vercel', 'netlify', 'cloudflare', 'linode', 'vultr',
        'oracle cloud', 'ibm cloud', 'alibaba cloud', 'kubernetes', 'docker', 'openshift',
        'cloud foundry', 'serverless', 'lambda', 'cloud functions', 'azure functions',
        'api gateway', 'aws lambda', 'aws step functions', 'aws ecs', 'aws s3',
        'azure storage', 'azure sql', 'azure synapse', 'azure logic apps', 'azure devops',
        'azure service bus', 'event hubs', 'google cloud storage', 'aws data lake',
        'aws codepipeline', 'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci'
    }
    
    TOOLS_TECHNOLOGIES = {
        'git', 'github', 'gitlab', 'bitbucket', 'jenkins', 'travis ci', 'circleci', 'github actions',
        'docker', 'kubernetes', 'terraform', 'ansible', 'puppet', 'chef', 'vagrant', 'nginx',
        'apache', 'tomcat', 'iis', 'load balancer', 'cdn', 'api gateway', 'microservices',
        'rest api', 'graphql', 'grpc', 'soap', 'websockets', 'oauth', 'jwt', 'saml', 'ldap',
        'active directory', 'ssl', 'tls', 'vpn', 'firewall', 'load testing', 'performance testing',
        'unit testing', 'integration testing', 'e2e testing', 'selenium', 'cypress', 'jest',
        'mocha', 'jasmine', 'pytest', 'junit', 'testng', 'postman', 'insomnia', 'swagger',
        'openapi', 'jira', 'confluence', 'slack', 'teams', 'zoom', 'notion', 'trello',
        'asana', 'monday', 'linear', 'figma', 'sketch', 'adobe xd', 'invision', 'zeplin',
        'power bi', 'tableau', 'looker', 'grafana', 'kibana', 'superset', 'd3', 'mabl',
        'playwright', 'celery', 'sidekiq', 'rabbitmq', 'kafka', 'phrase', 'greenhouse',
        'lever', 'workday', 'versionone', 'solidworks', 'sap', 'unity', 'databricks',
        'delta lake', 'spark', 'netsuite', 'forge', 'vast', 'xml', 'json', 'sass',
        'bootstrap', 'serverless', 'ci/cd', 'gitlab ci', 'maven', 'gradle', 'npm', 'yarn',
        'webpack', 'babel', 'eslint', 'prettier', 'typescript', 'powershell', 'bash'
    }
    
    SOFT_SKILLS = {
        'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
        'creativity', 'adaptability', 'time management', 'project management', 'agile',
        'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd', 'mentoring', 'coaching',
        'presentation', 'public speaking', 'writing', 'documentation', 'research',
        'analysis', 'strategy', 'planning', 'organization', 'collaboration', 'negotiation',
        'customer service', 'sales', 'marketing', 'business development', 'product management',
        'product owner', 'business analyst', 'data analysis', 'data science', 'machine learning',
        'artificial intelligence', 'deep learning', 'natural language processing', 'computer vision',
        'blockchain', 'cryptocurrency', 'cybersecurity', 'information security', 'penetration testing',
        'ethical hacking', 'compliance', 'gdpr', 'hipaa', 'sox', 'pci dss'
    }
    
    # Canonical mapping for normalized skills to avoid duplicates
    SKILL_CANONICAL_MAP = {
        'cpp': 'c++',
        'csharp': 'c#',
        'dotnet': '.net',
        'aspnet': 'asp.net',
        'sqlserver': 'sql server',
        'node-js': 'nodejs',
        'js': 'javascript',
        'ts': 'typescript',
    }

    TECHNOLOGY_SLUG_MAP: Dict[str, str] = {
        'react': 'react',
        'reactjs': 'react',
        'react-js': 'react',
        'vue-js': 'vue',
        'vuejs': 'vue',
        'angular': 'angular',
        'angularjs': 'angular',
        'nextjs': 'next.js',
        'next-js': 'next.js',
        'nuxtjs': 'nuxt.js',
        'nuxt-js': 'nuxt.js',
        'nodejs': 'nodejs',
        'node-js': 'nodejs',
        'expressjs': 'express',
        'express-js': 'express',
        'nestjs': 'nestjs',
        'django': 'django',
        'flask': 'flask',
        'fastapi': 'fastapi',
        'spring': 'spring',
        'spring-boot': 'spring boot',
        'laravel': 'laravel',
        'rails': 'rails',
        'dotnet': '.net',
        'csharp': 'c#',
        'cpp': 'c++',
        'cplusplus': 'c++',
        'java': 'java',
        'python': 'python',
        'go': 'go',
        'golang': 'go',
        'rust': 'rust',
        'kotlin': 'kotlin',
        'swift': 'swift',
        'sql': 'sql',
        'mysql': 'mysql',
        'postgresql': 'postgresql',
        'postgres': 'postgresql',
        'mongodb': 'mongodb',
        'dynamodb': 'dynamodb',
        'redis': 'redis',
        'elasticsearch': 'elasticsearch',
        'snowflake': 'snowflake',
        'bigquery': 'bigquery',
        'redshift': 'redshift',
        'aws': 'aws',
        'amazon-web-services': 'aws',
        'aws-lambda': 'aws lambda',
        'aws-step-functions': 'aws step functions',
        'amazon-api-gateway': 'api gateway',
        'amazon-ecs': 'aws ecs',
        'amazon-s3': 'aws s3',
        'azure': 'azure',
        'microsoft-azure': 'azure',
        'gcp': 'gcp',
        'google-cloud-platform': 'gcp',
        'kubernetes': 'kubernetes',
        'docker': 'docker',
        'terraform': 'terraform',
        'ansible': 'ansible',
        'jenkins': 'jenkins',
        'github-actions': 'github actions',
        'github': 'github',
        'gitlab': 'gitlab',
        'gitlab-ci': 'gitlab ci',
        'ci-cd': 'ci/cd',
        'celery': 'celery',
        'rabbitmq': 'rabbitmq',
        'kafka': 'kafka',
        'tensorflow': 'tensorflow',
        'pytorch': 'pytorch',
        'scikit-learn': 'scikit-learn',
        'nlp': 'natural language processing',
        'ml': 'machine learning',
        'ai': 'artificial intelligence',
        'power-bi': 'power bi',
        'tableau': 'tableau',
        'looker': 'looker',
        'cypress': 'cypress',
        'selenium': 'selenium',
        'postman': 'postman',
        'jest': 'jest',
        'pytest': 'pytest',
        'junit': 'junit',
        'gradle': 'gradle',
        'maven': 'maven',
        'unity-3d': 'unity',
        'databricks': 'databricks',
        'delta-lake': 'delta lake',
        'apache-spark-sql': 'spark',
        'spark': 'spark',
        'sidekiq': 'sidekiq',
        'netsuite': 'netsuite',
        'phrase': 'phrase',
        'greenhouse': 'greenhouse',
        'workday': 'workday',
        'confluence': 'confluence',
        'jira': 'jira',
        'lever': 'lever',
        'xml-format': 'xml',
        'json': 'json',
        'axios': 'axios',
        'enzyme': 'enzyme',
        'jasmine': 'jasmine',
        'karma-runner': 'karma',
        'casperjs': 'casperjs',
        'versionone': 'versionone',
        'bootstrap': 'bootstrap',
        'sass': 'sass',
        'serverless': 'serverless',
        'php': 'php',
        'perl': 'perl',
        'ruby': 'ruby',
        'javascript': 'javascript',
        'typescript': 'typescript',
        'microsoft-typescript': 'typescript',
        'mariadb': 'mariadb',
        'cassandra': 'cassandra',
        'apache-cassandra': 'cassandra',
        'clickhouse': 'clickhouse',
        'grafana': 'grafana',
        'kibana': 'kibana',
        'superset': 'superset',
        'd3': 'd3',
        'mabl': 'mabl',
        'playwright': 'playwright',
        'ios': 'ios',
        'swift': 'swift',
        'turning': 'swift',  # iOS related
        'kotlin': 'kotlin',
        'solidworks': 'solidworks',
        'sap': 'sap',
        'forge': 'forge',
        'vast-data': 'vast',
        'component': 'react',  # Common React component pattern
        'event-hub': 'event hubs',
        'azure-service-bus': 'azure service bus',
        'azure-storage': 'azure storage',
        'azure-sql-database': 'azure sql',
        'azure-synapse': 'azure synapse',
        'azure-synapse-analytics': 'azure synapse',
        'microsoft-azure-storage': 'azure storage',
        'microsoft-power-apps': 'power apps',
        'power-bi': 'power bi',
        'microsoft-dynamics-365-business-central': 'dynamics 365',
        'microsoft-power-platform': 'power platform',
        'microsoft-azure': 'azure',
        'microsoft-azure-logic-apps': 'azure logic apps',
        'azure-devops': 'azure devops',
        'dynamics-crm': 'dynamics crm',
        'terraform': 'terraform',
        'powershell': 'powershell',
        'aws-data-lake-storage': 'aws data lake',
        'google-cloud-storage': 'google cloud storage',
        'aws-codepipeline': 'aws codepipeline',
        'spring-data': 'spring data',
        'spring-security': 'spring security',
        'spring-cloud': 'spring cloud',
        'hibernate': 'hibernate',
    }
    
    @property
    def all_predefined_skills(self) -> Set[str]:
        """Get all predefined skills as a set."""
        return (self.PROGRAMMING_LANGUAGES | self.FRAMEWORKS_LIBRARIES | 
                self.DATABASES | self.CLOUD_PLATFORMS | 
                self.TOOLS_TECHNOLOGIES | self.SOFT_SKILLS)
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for better skill extraction."""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Replace common variations
        replacements = {
            'node.js': 'nodejs',
            'react.js': 'react',
            'vue.js': 'vue',
            'angular.js': 'angular',
            'c++': 'cpp',
            'c#': 'csharp',
            '.net': 'dotnet',
            'asp.net': 'aspnet',
            'sql server': 'sqlserver',
            'google cloud platform': 'gcp',
            'amazon web services': 'aws',
            'microsoft azure': 'azure',
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text
    
    def _extract_with_spacy(self, text: str) -> Set[str]:
        """Extract skills using spaCy NLP processing."""
        skills = set()
        
        try:
            doc = self._nlp(text)
            
            # Extract named entities that might be technologies
            for ent in doc.ents:
                if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART']:
                    skill = ent.text.lower().strip()
                    if len(skill) > 1 and skill.replace(' ', '').isalnum():
                        skills.add(skill)
            
            # Extract noun phrases that might be skills (only if parser is available)
            if 'parser' in self._nlp.pipe_names:
                for chunk in doc.noun_chunks:
                    chunk_text = chunk.text.lower().strip()
                    # Filter for technical-sounding noun phrases
                    if (len(chunk_text.split()) <= 3 and 
                        len(chunk_text) > 2 and 
                        not chunk_text.startswith(('the ', 'a ', 'an '))):
                        skills.add(chunk_text)
            
            # Extract tokens that look like technologies (only if tagger is available)
            if 'tagger' in self._nlp.pipe_names:
                for token in doc:
                    if (token.pos_ in ['NOUN', 'PROPN'] and 
                        not token.is_stop and 
                        not token.is_punct and 
                        len(token.text) > 2):
                        skills.add(token.text.lower())
            else:
                # Fallback: extract all potential technical tokens without POS tagging
                for token in doc:
                    if (not token.is_stop and 
                        not token.is_punct and 
                        len(token.text) > 2 and
                        token.text.isalnum()):
                        skills.add(token.text.lower())
                    
        except Exception as e:
            logger.warning(f"Error in spaCy processing: {e}")
        
        return skills
    
    def _extract_with_keywords(self, text: str) -> Set[str]:
        """Extract skills using predefined keyword matching."""
        skills = set()
        text_lower = text.lower()
        
        # Check for exact matches and partial matches
        for skill in self.all_predefined_skills:
            # Exact word boundary matching
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                skills.add(skill)
        
        return skills
    
    def _filter_skills(self, skills: Set[str]) -> List[str]:
        """Filter and clean extracted skills."""
        filtered_skills = []
        
        # Common words to exclude
        exclude_words = {
            'experience', 'knowledge', 'skills', 'ability', 'strong', 'good', 'excellent',
            'years', 'year', 'work', 'working', 'team', 'development', 'software',
            'application', 'applications', 'system', 'systems', 'technology', 'technologies',
            'tool', 'tools', 'platform', 'platforms', 'service', 'services', 'solution',
            'solutions', 'product', 'products', 'project', 'projects', 'business',
            'company', 'client', 'customer', 'user', 'users', 'data', 'information',
            'management', 'manager', 'lead', 'senior', 'junior', 'entry', 'level',
            'position', 'role', 'job', 'career', 'opportunity', 'requirements',
            'qualifications', 'responsibilities', 'duties', 'tasks', 'environment',
            'culture', 'benefits', 'salary', 'compensation', 'location', 'remote',
            'office', 'onsite', 'hybrid', 'full', 'part', 'time', 'contract',
            'permanent', 'temporary', 'internship', 'graduate', 'degree', 'bachelor',
            'master', 'phd', 'certification', 'certified', 'preferred', 'required',
            'must', 'should', 'will', 'can', 'able', 'plus', 'bonus', 'nice',
            'have', 'having', 'include', 'including', 'such', 'like', 'similar',
            'related', 'relevant', 'applicable', 'appropriate', 'suitable', 'ideal',
            'perfect', 'great', 'amazing', 'awesome', 'fantastic', 'wonderful'
        }
        
        for skill in skills:
            skill = skill.strip()
            
            # Skip if empty, too short, or in exclude list
            if not skill or len(skill) < 2 or skill in exclude_words:
                continue
            
            # Skip if it's just numbers or special characters
            if not re.search(r'[a-zA-Z]', skill):
                continue
            
            # Skip if it's too long (likely not a skill)
            if len(skill) > 50:
                continue
            
            # Skip if it contains too many spaces (likely a sentence fragment)
            if skill.count(' ') > 3:
                continue
            
            # Apply canonical mapping to avoid duplicates
            canonical_skill = self.SKILL_CANONICAL_MAP.get(skill, skill)
            filtered_skills.append(canonical_skill)
        
        # Remove duplicates and sort
        return sorted(list(set(filtered_skills)))
    
    def map_technology_slugs(self, slugs: Optional[List[str]]) -> List[str]:
        """Map TheirStack technology slugs to canonical skill names."""
        if not slugs:
            return []

        mapped: Set[str] = set()
        for slug in slugs:
            if not slug:
                continue
            slug_normalized = slug.strip().lower()
            if not slug_normalized:
                continue

            canonical = self.TECHNOLOGY_SLUG_MAP.get(slug_normalized)
            if not canonical:
                canonical = slug_normalized.replace('-', ' ').replace('_', ' ')

            canonical = self.SKILL_CANONICAL_MAP.get(canonical, canonical)
            mapped.add(canonical)

        return sorted(mapped)

    def extract_skills(self, text: str, technology_slugs: Optional[List[str]] = None) -> List[str]:
        """
        Extract skills from job description text, merging technology slug data when provided.

        Args:
            text: Job description text
            technology_slugs: Optional list of technology identifiers from TheirStack

        Returns:
            List[str]: Extracted and filtered skills
        """
        normalized_slugs: tuple = ()
        if technology_slugs:
            normalized_slugs = tuple(sorted({slug.strip().lower() for slug in technology_slugs if slug}))

        return self._extract_skills_cached(text, normalized_slugs)

    @lru_cache(maxsize=1000)
    def _extract_skills_cached(self, text: str, normalized_slugs: tuple) -> List[str]:
        if not text or not isinstance(text, str):
            return []

        processed_text = self._preprocess_text(text)

        spacy_skills = self._extract_with_spacy(text)
        keyword_skills = self._extract_with_keywords(processed_text)
        technology_skills = set(self.map_technology_slugs(list(normalized_slugs)))

        all_skills = spacy_skills | keyword_skills | technology_skills
        filtered_skills = self._filter_skills(all_skills)

        logger.debug(
            "Extracted %s skills (including %s technology slugs) from text length %s",
            len(filtered_skills),
            len(technology_skills),
            len(text),
        )

        return filtered_skills
    
    def get_skill_categories(self, skills: List[str]) -> dict:
        """
        Categorize skills into different types.
        
        Args:
            skills: List of skills to categorize
            
        Returns:
            dict: Skills categorized by type
        """
        categories = {
            'programming_languages': [],
            'frameworks_libraries': [],
            'databases': [],
            'cloud_platforms': [],
            'tools_technologies': [],
            'soft_skills': [],
            'other': []
        }
        
        for skill in skills:
            skill_lower = skill.lower()
            
            if skill_lower in self.PROGRAMMING_LANGUAGES:
                categories['programming_languages'].append(skill)
            elif skill_lower in self.FRAMEWORKS_LIBRARIES:
                categories['frameworks_libraries'].append(skill)
            elif skill_lower in self.DATABASES:
                categories['databases'].append(skill)
            elif skill_lower in self.CLOUD_PLATFORMS:
                categories['cloud_platforms'].append(skill)
            elif skill_lower in self.TOOLS_TECHNOLOGIES:
                categories['tools_technologies'].append(skill)
            elif skill_lower in self.SOFT_SKILLS:
                categories['soft_skills'].append(skill)
            else:
                categories['other'].append(skill)
        
        return categories


# Global instance for easy access
skill_extractor = SkillExtractor()
