/**
 * ParameterConfigComponent - Manages IKFast parameter configuration
 */

class ParameterConfigComponent {
    constructor() {
        this.parameters = {
            baseLink: null,
            eeLink: null,
            ikType: CONFIG.DEFAULT_IKTYPE
        };
        this.elements = null;
    }
    
    /**
     * Initialize UI elements
     * @param {Object} elements - DOM elements
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Set default IK type
        if (this.elements.ikTypeSelect) {
            this.elements.ikTypeSelect.value = this.parameters.ikType;
        }
    }
    
    /**
     * Get current parameters
     * @returns {Object} Current parameters
     */
    getParameters() {
        if (this.elements) {
            this.parameters.baseLink = this.elements.baseLinkInput.value ? 
                parseInt(this.elements.baseLinkInput.value) : null;
            this.parameters.eeLink = this.elements.eeLinkInput.value ? 
                parseInt(this.elements.eeLinkInput.value) : null;
            this.parameters.ikType = this.elements.ikTypeSelect.value;
        }
        return this.parameters;
    }
    
    /**
     * Set parameters
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
    }
    
    /**
     * Validate parameters
     * @param {Object} params - Parameters to validate
     * @returns {Object} Validation result
     */
    validateParameters(params) {
        const errors = {};
        let valid = true;
        
        // Validate base link
        if (params.baseLink === null || params.baseLink === undefined || params.baseLink === '') {
            errors.baseLink = 'Base link is required';
            valid = false;
        } else if (!Number.isInteger(params.baseLink) || params.baseLink < 0) {
            errors.baseLink = 'Base link must be a non-negative integer';
            valid = false;
        }
        
        // Validate ee link
        if (params.eeLink === null || params.eeLink === undefined || params.eeLink === '') {
            errors.eeLink = 'End effector link is required';
            valid = false;
        } else if (!Number.isInteger(params.eeLink) || params.eeLink < 0) {
            errors.eeLink = 'End effector link must be a non-negative integer';
            valid = false;
        }
        
        // Validate that base_link != ee_link
        if (valid && params.baseLink === params.eeLink) {
            errors.general = 'Base link and end effector link cannot be the same';
            valid = false;
        }
        
        // Validate IK type
        if (!params.ikType) {
            errors.ikType = 'IK type is required';
            valid = false;
        }
        
        return {
            valid: valid,
            errors: errors
        };
    }
    
    /**
     * Display validation errors
     * @param {Object} errors - Validation errors
     */
    displayValidationErrors(errors) {
        console.error('Validation errors:', errors);
        
        // Display errors in UI if elements are available
        if (this.elements) {
            if (errors.baseLink && this.elements.baseLinkError) {
                this.elements.baseLinkError.textContent = errors.baseLink;
                this.elements.baseLinkError.style.display = 'block';
            }
            if (errors.eeLink && this.elements.eeLinkError) {
                this.elements.eeLinkError.textContent = errors.eeLink;
                this.elements.eeLinkError.style.display = 'block';
            }
            if (errors.ikType && this.elements.ikTypeError) {
                this.elements.ikTypeError.textContent = errors.ikType;
                this.elements.ikTypeError.style.display = 'block';
            }
        }
    }
}
