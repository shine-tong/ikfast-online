/**
 * ParameterConfigComponent - Handles IKFast parameter configuration
 * ES Module version for testing
 */

class ParameterConfigComponent {
    constructor() {
        this.parameters = {
            baseLink: null,
            eeLink: null,
            ikType: 'transform6d'
        };
        this.elements = null;
        this.validationErrors = {};
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the parameter config UI
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Set up event listeners
        if (elements.baseLinkInput) {
            elements.baseLinkInput.addEventListener('input', () => this.handleBaseLinkChange());
            elements.baseLinkInput.addEventListener('blur', () => this.validateBaseLink());
        }
        
        if (elements.eeLinkInput) {
            elements.eeLinkInput.addEventListener('input', () => this.handleEeLinkChange());
            elements.eeLinkInput.addEventListener('blur', () => this.validateEeLink());
        }
        
        if (elements.ikTypeSelect) {
            elements.ikTypeSelect.addEventListener('change', () => this.handleIkTypeChange());
        }
        
        // Initialize UI state
        this.setDefaults();
        this.updateUIState();
    }
    
    /**
     * Set default values
     */
    setDefaults() {
        this.parameters.ikType = 'transform6d';
        
        if (this.elements && this.elements.ikTypeSelect) {
            this.elements.ikTypeSelect.value = 'transform6d';
        }
    }
    
    /**
     * Handle base link input change
     */
    handleBaseLinkChange() {
        const value = this.elements.baseLinkInput.value.trim();
        
        if (value === '') {
            this.parameters.baseLink = null;
        } else {
            const parsed = parseInt(value, 10);
            this.parameters.baseLink = isNaN(parsed) ? value : parsed;
        }
        
        this.clearValidationError('baseLink');
        this.updateUIState();
    }
    
    /**
     * Handle end effector link input change
     */
    handleEeLinkChange() {
        const value = this.elements.eeLinkInput.value.trim();
        
        if (value === '') {
            this.parameters.eeLink = null;
        } else {
            const parsed = parseInt(value, 10);
            this.parameters.eeLink = isNaN(parsed) ? value : parsed;
        }
        
        this.clearValidationError('eeLink');
        this.updateUIState();
    }
    
    /**
     * Handle iktype selection change
     */
    handleIkTypeChange() {
        this.parameters.ikType = this.elements.ikTypeSelect.value;
        this.clearValidationError('ikType');
        this.updateUIState();
    }
    
    /**
     * Validate base link index
     * @returns {boolean} True if valid
     */
    validateBaseLink() {
        const validation = this.validateLinkIndex(this.parameters.baseLink);
        
        if (!validation.valid) {
            this.setValidationError('baseLink', validation.error);
            return false;
        }
        
        this.clearValidationError('baseLink');
        return true;
    }
    
    /**
     * Validate end effector link index
     * @returns {boolean} True if valid
     */
    validateEeLink() {
        const validation = this.validateLinkIndex(this.parameters.eeLink);
        
        if (!validation.valid) {
            this.setValidationError('eeLink', validation.error);
            return false;
        }
        
        this.clearValidationError('eeLink');
        return true;
    }
    
    /**
     * Validate link index (must be non-negative integer)
     * @param {any} value - The value to validate
     * @returns {{valid: boolean, error?: string}}
     */
    validateLinkIndex(value) {
        // Check if value is null or undefined
        if (value === null || value === undefined) {
            return {
                valid: false,
                error: '璇疯緭鍏ラ摼鎺ョ储寮?
            };
        }
        
        // Check if value is an integer
        if (!Number.isInteger(value)) {
            return {
                valid: false,
                error: '閾炬帴绱㈠紩蹇呴』鏄暣鏁?
            };
        }
        
        // Check if value is non-negative
        if (value < 0) {
            return {
                valid: false,
                error: '閾炬帴绱㈠紩蹇呴』鏄潪璐熸暣鏁?
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Validate iktype selection
     * @param {string} ikType - The iktype to validate
     * @returns {{valid: boolean, error?: string}}
     */
    validateIkType(ikType) {
        const validTypes = CONFIG.IK_TYPES.map(t => t.value);
        
        if (!ikType || typeof ikType !== 'string') {
            return {
                valid: false,
                error: '璇烽€夋嫨 IK 绫诲瀷'
            };
        }
        
        if (!validTypes.includes(ikType)) {
            return {
                valid: false,
                error: '鏃犳晥鐨?IK 绫诲瀷'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Validate all parameters
     * @returns {{valid: boolean, errors: Object}}
     */
    validateParameters(params = this.parameters) {
        const errors = {};
        let valid = true;
        
        // Validate base link
        const baseLinkValidation = this.validateLinkIndex(params.baseLink);
        if (!baseLinkValidation.valid) {
            errors.baseLink = baseLinkValidation.error;
            valid = false;
        }
        
        // Validate ee link
        const eeLinkValidation = this.validateLinkIndex(params.eeLink);
        if (!eeLinkValidation.valid) {
            errors.eeLink = eeLinkValidation.error;
            valid = false;
        }
        
        // Validate that base_link 鈮?ee_link
        if (valid && params.baseLink === params.eeLink) {
            errors.general = '鍩哄骇閾炬帴鍜屾湯绔墽琛屽櫒閾炬帴涓嶈兘鐩稿悓';
            valid = false;
        }
        
        // Validate iktype
        const ikTypeValidation = this.validateIkType(params.ikType);
        if (!ikTypeValidation.valid) {
            errors.ikType = ikTypeValidation.error;
            valid = false;
        }
        
        return { valid, errors };
    }
    
    /**
     * Get current parameters
     * @returns {Object} Current parameters
     */
    getParameters() {
        return { ...this.parameters };
    }
    
    /**
     * Set parameters (e.g., from link selection)
     * @param {Object} params - Parameters to set
     */
    setParameters(params) {
        if (params.baseLink !== undefined) {
            this.parameters.baseLink = params.baseLink;
            if (this.elements && this.elements.baseLinkInput) {
                this.elements.baseLinkInput.value = params.baseLink;
            }
        }
        
        if (params.eeLink !== undefined) {
            this.parameters.eeLink = params.eeLink;
            if (this.elements && this.elements.eeLinkInput) {
                this.elements.eeLinkInput.value = params.eeLink;
            }
        }
        
        if (params.ikType !== undefined) {
            this.parameters.ikType = params.ikType;
            if (this.elements && this.elements.ikTypeSelect) {
                this.elements.ikTypeSelect.value = params.ikType;
            }
        }
        
        this.updateUIState();
    }
    
    /**
     * Set validation error for a field
     * @param {string} field - Field name
     * @param {string} error - Error message
     */
    setValidationError(field, error) {
        this.validationErrors[field] = error;
        
        if (this.elements) {
            const errorElement = this.elements[`${field}Error`];
            if (errorElement) {
                errorElement.textContent = error;
                errorElement.style.display = 'block';
            }
            
            const inputElement = this.elements[`${field}Input`] || this.elements[`${field}Select`];
            if (inputElement) {
                inputElement.classList.add('invalid');
            }
        }
    }
    
    /**
     * Clear validation error for a field
     * @param {string} field - Field name
     */
    clearValidationError(field) {
        delete this.validationErrors[field];
        
        if (this.elements) {
            const errorElement = this.elements[`${field}Error`];
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            
            const inputElement = this.elements[`${field}Input`] || this.elements[`${field}Select`];
            if (inputElement) {
                inputElement.classList.remove('invalid');
            }
        }
    }
    
    /**
     * Clear all validation errors
     */
    clearAllValidationErrors() {
        this.validationErrors = {};
        
        if (this.elements) {
            ['baseLink', 'eeLink', 'ikType', 'general'].forEach(field => {
                this.clearValidationError(field);
            });
        }
    }
    
    /**
     * Display validation errors
     * @param {Object} errors - Validation errors
     */
    displayValidationErrors(errors) {
        this.clearAllValidationErrors();
        
        Object.keys(errors).forEach(field => {
            this.setValidationError(field, errors[field]);
        });
    }
    
    /**
     * Update UI state
     */
    updateUIState() {
        // This method can be extended to update button states, etc.
    }
    
    /**
     * Reset to default state
     */
    reset() {
        this.parameters = {
            baseLink: null,
            eeLink: null,
            ikType: 'transform6d'
        };
        
        if (this.elements) {
            if (this.elements.baseLinkInput) {
                this.elements.baseLinkInput.value = '';
            }
            if (this.elements.eeLinkInput) {
                this.elements.eeLinkInput.value = '';
            }
            if (this.elements.ikTypeSelect) {
                this.elements.ikTypeSelect.value = 'transform6d';
            }
        }
        
        this.clearAllValidationErrors();
        this.updateUIState();
    }
}
