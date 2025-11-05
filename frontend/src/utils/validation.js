// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return emailRegex.test(email)
}

// Password strength validation (matching backend requirements)
export const validatePassword = (password) => {
  const errors = []
  
  if (!password) {
    errors.push('Password is required')
    return errors
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return errors
}

// Password strength checker
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'No password', color: 'gray' }
  
  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  
  // Calculate score
  Object.values(checks).forEach(check => {
    if (check) score++
  })
  
  // Additional points for length
  if (password.length >= 12) score += 0.5
  if (password.length >= 16) score += 0.5
  
  // Determine strength
  if (score < 2) {
    return { score, label: 'Very Weak', color: 'red' }
  } else if (score < 3) {
    return { score, label: 'Weak', color: 'orange' }
  } else if (score < 4) {
    return { score, label: 'Fair', color: 'yellow' }
  } else if (score < 5) {
    return { score, label: 'Good', color: 'blue' }
  } else {
    return { score, label: 'Strong', color: 'green' }
  }
}

// Full name validation
export const validateFullName = (name) => {
  if (!name || name.trim().length === 0) {
    return 'Full name is required'
  }
  
  if (name.trim().length < 2) {
    return 'Full name must be at least 2 characters long'
  }
  
  if (name.trim().length > 100) {
    return 'Full name must be less than 100 characters'
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/
  if (!nameRegex.test(name)) {
    return 'Full name can only contain letters, spaces, hyphens, and apostrophes'
  }
  
  return null
}

// Skills validation
export const validateSkills = (skills) => {
  if (!skills || skills.length === 0) {
    return 'Please select at least one skill'
  }
  
  if (skills.length > 20) {
    return 'Please select no more than 20 skills'
  }
  
  return null
}

// Target roles validation
export const validateTargetRoles = (roles) => {
  if (!roles || roles.length === 0) {
    return 'Please select at least one target role'
  }
  
  if (roles.length > 5) {
    return 'Please select no more than 5 target roles'
  }
  
  return null
}

// Experience level validation
export const validateExperienceLevel = (level) => {
  const validLevels = ['entry', 'mid', 'senior', 'lead', 'executive']
  
  if (!level) {
    return 'Please select your experience level'
  }
  
  if (!validLevels.includes(level)) {
    return 'Please select a valid experience level'
  }
  
  return null
}

// Location validation
export const validateLocation = (location) => {
  if (!location || location.trim().length === 0) {
    return 'Location is required'
  }
  
  if (location.trim().length < 2) {
    return 'Location must be at least 2 characters long'
  }
  
  if (location.trim().length > 100) {
    return 'Location must be less than 100 characters'
  }
  
  return null
}

// Generic form validation helper
export const validateForm = (data, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const value = data[field]
    const fieldRules = rules[field]
    
    // Required validation
    if (fieldRules.required && (!value || value.toString().trim().length === 0)) {
      errors[field] = typeof fieldRules.required === 'string' 
        ? fieldRules.required 
        : `${field} is required`
      return
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim().length === 0) return
    
    // Min length validation
    if (fieldRules.minLength && value.toString().length < fieldRules.minLength.value) {
      errors[field] = fieldRules.minLength.message
      return
    }
    
    // Max length validation
    if (fieldRules.maxLength && value.toString().length > fieldRules.maxLength.value) {
      errors[field] = fieldRules.maxLength.message
      return
    }
    
    // Pattern validation
    if (fieldRules.pattern && !fieldRules.pattern.value.test(value.toString())) {
      errors[field] = fieldRules.pattern.message
      return
    }
    
    // Custom validation function
    if (fieldRules.validate && typeof fieldRules.validate === 'function') {
      const customError = fieldRules.validate(value)
      if (customError) {
        errors[field] = customError
        return
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Debounce utility for validation
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
