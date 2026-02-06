import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParameterConfigComponent } from '../web/parameter-config.module.js';

describe('ParameterConfigComponent - Unit Tests', () => {
    let parameterConfig;
    let mockElements;

    beforeEach(() => {
        parameterConfig = new ParameterConfigComponent();
        
        // Mock DOM elements
        mockElements = {
            baseLinkInput: {
                addEventListener: vi.fn(),
                value: '',
                classList: {
                    add: vi.fn(),
                    remove: vi.fn()
                }
            },
            eeLinkInput: {
                addEventListener: vi.fn(),
                value: '',
                classList: {
                    add: vi.fn(),
                    remove: vi.fn()
                }
            },
            ikTypeSelect: {
                addEventListener: vi.fn(),
                value: 'transform6d',
                classList: {
                    add: vi.fn(),
                    remove: vi.fn()
                }
            },
            baseLinkError: {
                textContent: '',
                style: { display: 'none' }
            },
            eeLinkError: {
                textContent: '',
                style: { display: 'none' }
            },
            ikTypeError: {
                textContent: '',
                style: { display: 'none' }
            },
            generalError: {
                textContent: '',
                style: { display: 'none' }
            }
        };
    });

    describe('Initialization', () => {
        it('should initialize with default parameters', () => {
            expect(parameterConfig.parameters.baseLink).toBeNull();
            expect(parameterConfig.parameters.eeLink).toBeNull();
            expect(parameterConfig.parameters.ikType).toBe('transform6d');
        });

        it('should set up event listeners on initialization', () => {
            parameterConfig.initializeUI(mockElements);
            
            expect(mockElements.baseLinkInput.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
            expect(mockElements.baseLinkInput.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
            expect(mockElements.eeLinkInput.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
            expect(mockElements.eeLinkInput.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
            expect(mockElements.ikTypeSelect.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('should set default iktype value on initialization', () => {
            parameterConfig.initializeUI(mockElements);
            
            expect(mockElements.ikTypeSelect.value).toBe('transform6d');
        });
    });

    describe('Default Values', () => {
        it('should set default iktype to transform6d', () => {
            parameterConfig.setDefaults();
            
            expect(parameterConfig.parameters.ikType).toBe('transform6d');
        });

        it('should update UI element when setting defaults', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.setDefaults();
            
            expect(mockElements.ikTypeSelect.value).toBe('transform6d');
        });
    });

    describe('Input Validation', () => {
        it('should validate non-negative integer for base link', () => {
            const result = parameterConfig.validateLinkIndex(5);
            
            expect(result.valid).toBe(true);
        });

        it('should reject negative integer for base link', () => {
            const result = parameterConfig.validateLinkIndex(-1);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should reject null for link index', () => {
            const result = parameterConfig.validateLinkIndex(null);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should reject non-integer for link index', () => {
            const result = parameterConfig.validateLinkIndex(3.14);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should accept zero as valid link index', () => {
            const result = parameterConfig.validateLinkIndex(0);
            
            expect(result.valid).toBe(true);
        });
    });

    describe('IKType Options', () => {
        it('should validate all predefined iktype options', () => {
            CONFIG.IK_TYPES.forEach(ikType => {
                const result = parameterConfig.validateIkType(ikType.value);
                expect(result.valid).toBe(true);
            });
        });

        it('should reject invalid iktype', () => {
            const result = parameterConfig.validateIkType('invalid_type');
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should reject null iktype', () => {
            const result = parameterConfig.validateIkType(null);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should reject empty string iktype', () => {
            const result = parameterConfig.validateIkType('');
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should have transform6d as first option', () => {
            expect(CONFIG.IK_TYPES[0].value).toBe('transform6d');
        });

        it('should have descriptions for all iktype options', () => {
            CONFIG.IK_TYPES.forEach(ikType => {
                expect(ikType.description).toBeTruthy();
                expect(typeof ikType.description).toBe('string');
                expect(ikType.description.length).toBeGreaterThan(0);
            });
        });

        it('should have labels for all iktype options', () => {
            CONFIG.IK_TYPES.forEach(ikType => {
                expect(ikType.label).toBeTruthy();
                expect(typeof ikType.label).toBe('string');
                expect(ikType.label.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Parameter Validation', () => {
        it('should validate complete valid parameters', () => {
            const params = {
                baseLink: 0,
                eeLink: 5,
                ikType: 'transform6d'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(true);
            expect(Object.keys(result.errors).length).toBe(0);
        });

        it('should reject when base_link equals ee_link', () => {
            const params = {
                baseLink: 3,
                eeLink: 3,
                ikType: 'transform6d'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(false);
            expect(result.errors.general).toBeTruthy();
        });

        it('should reject when base_link is invalid', () => {
            const params = {
                baseLink: -1,
                eeLink: 5,
                ikType: 'transform6d'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(false);
            expect(result.errors.baseLink).toBeTruthy();
        });

        it('should reject when ee_link is invalid', () => {
            const params = {
                baseLink: 0,
                eeLink: null,
                ikType: 'transform6d'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(false);
            expect(result.errors.eeLink).toBeTruthy();
        });

        it('should reject when iktype is invalid', () => {
            const params = {
                baseLink: 0,
                eeLink: 5,
                ikType: 'invalid'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(false);
            expect(result.errors.ikType).toBeTruthy();
        });

        it('should provide multiple error messages for multiple invalid parameters', () => {
            const params = {
                baseLink: -1,
                eeLink: null,
                ikType: 'invalid'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(false);
            expect(Object.keys(result.errors).length).toBeGreaterThan(1);
        });
    });

    describe('Parameter Getters and Setters', () => {
        it('should get current parameters', () => {
            parameterConfig.parameters = {
                baseLink: 1,
                eeLink: 8,
                ikType: 'translation3d'
            };
            
            const params = parameterConfig.getParameters();
            
            expect(params.baseLink).toBe(1);
            expect(params.eeLink).toBe(8);
            expect(params.ikType).toBe('translation3d');
        });

        it('should set parameters', () => {
            parameterConfig.initializeUI(mockElements);
            
            parameterConfig.setParameters({
                baseLink: 2,
                eeLink: 7,
                ikType: 'direction3d'
            });
            
            expect(parameterConfig.parameters.baseLink).toBe(2);
            expect(parameterConfig.parameters.eeLink).toBe(7);
            expect(parameterConfig.parameters.ikType).toBe('direction3d');
            expect(mockElements.baseLinkInput.value).toBe(2);
            expect(mockElements.eeLinkInput.value).toBe(7);
            expect(mockElements.ikTypeSelect.value).toBe('direction3d');
        });

        it('should set partial parameters', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.parameters = {
                baseLink: 1,
                eeLink: 5,
                ikType: 'transform6d'
            };
            
            parameterConfig.setParameters({ baseLink: 3 });
            
            expect(parameterConfig.parameters.baseLink).toBe(3);
            expect(parameterConfig.parameters.eeLink).toBe(5);
            expect(parameterConfig.parameters.ikType).toBe('transform6d');
        });
    });

    describe('Input Handling', () => {
        it('should handle base link input change', () => {
            parameterConfig.initializeUI(mockElements);
            mockElements.baseLinkInput.value = '5';
            
            parameterConfig.handleBaseLinkChange();
            
            expect(parameterConfig.parameters.baseLink).toBe(5);
        });

        it('should handle ee link input change', () => {
            parameterConfig.initializeUI(mockElements);
            mockElements.eeLinkInput.value = '8';
            
            parameterConfig.handleEeLinkChange();
            
            expect(parameterConfig.parameters.eeLink).toBe(8);
        });

        it('should handle iktype selection change', () => {
            parameterConfig.initializeUI(mockElements);
            mockElements.ikTypeSelect.value = 'translation3d';
            
            parameterConfig.handleIkTypeChange();
            
            expect(parameterConfig.parameters.ikType).toBe('translation3d');
        });

        it('should handle empty base link input', () => {
            parameterConfig.initializeUI(mockElements);
            mockElements.baseLinkInput.value = '';
            
            parameterConfig.handleBaseLinkChange();
            
            expect(parameterConfig.parameters.baseLink).toBeNull();
        });

        it('should handle empty ee link input', () => {
            parameterConfig.initializeUI(mockElements);
            mockElements.eeLinkInput.value = '';
            
            parameterConfig.handleEeLinkChange();
            
            expect(parameterConfig.parameters.eeLink).toBeNull();
        });

        it('should parse integer from string input', () => {
            parameterConfig.initializeUI(mockElements);
            mockElements.baseLinkInput.value = '  10  ';
            
            parameterConfig.handleBaseLinkChange();
            
            expect(parameterConfig.parameters.baseLink).toBe(10);
        });

        it('should handle non-numeric input', () => {
            parameterConfig.initializeUI(mockElements);
            mockElements.baseLinkInput.value = 'abc';
            
            parameterConfig.handleBaseLinkChange();
            
            // Should store the string value (will be validated later)
            expect(parameterConfig.parameters.baseLink).toBe('abc');
        });
    });

    describe('Validation Error Display', () => {
        it('should display validation error for field', () => {
            parameterConfig.initializeUI(mockElements);
            
            parameterConfig.setValidationError('baseLink', 'Invalid base link');
            
            expect(mockElements.baseLinkError.textContent).toBe('Invalid base link');
            expect(mockElements.baseLinkError.style.display).toBe('block');
            expect(mockElements.baseLinkInput.classList.add).toHaveBeenCalledWith('invalid');
        });

        it('should clear validation error for field', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.validationErrors.baseLink = 'Some error';
            mockElements.baseLinkError.textContent = 'Some error';
            mockElements.baseLinkError.style.display = 'block';
            
            parameterConfig.clearValidationError('baseLink');
            
            expect(mockElements.baseLinkError.textContent).toBe('');
            expect(mockElements.baseLinkError.style.display).toBe('none');
            expect(mockElements.baseLinkInput.classList.remove).toHaveBeenCalledWith('invalid');
            expect(parameterConfig.validationErrors.baseLink).toBeUndefined();
        });

        it('should clear all validation errors', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.validationErrors = {
                baseLink: 'Error 1',
                eeLink: 'Error 2',
                ikType: 'Error 3'
            };
            
            parameterConfig.clearAllValidationErrors();
            
            expect(Object.keys(parameterConfig.validationErrors).length).toBe(0);
        });

        it('should display multiple validation errors', () => {
            parameterConfig.initializeUI(mockElements);
            
            const errors = {
                baseLink: 'Base link error',
                eeLink: 'EE link error',
                ikType: 'IK type error'
            };
            
            parameterConfig.displayValidationErrors(errors);
            
            expect(mockElements.baseLinkError.textContent).toBe('Base link error');
            expect(mockElements.eeLinkError.textContent).toBe('EE link error');
            expect(mockElements.ikTypeError.textContent).toBe('IK type error');
        });
    });

    describe('Tooltip Display', () => {
        it('should have descriptions for technical terms', () => {
            // Verify that IK_TYPES have descriptions (used for tooltips)
            CONFIG.IK_TYPES.forEach(ikType => {
                expect(ikType.description).toBeTruthy();
                expect(ikType.description.length).toBeGreaterThan(0);
            });
        });

        it('should provide meaningful descriptions for each iktype', () => {
            const transform6d = CONFIG.IK_TYPES.find(t => t.value === 'transform6d');
            expect(transform6d.description).toContain('位置');
            expect(transform6d.description).toContain('姿态');
            
            const translation3d = CONFIG.IK_TYPES.find(t => t.value === 'translation3d');
            expect(translation3d.description).toContain('位置');
        });
    });

    describe('Reset Functionality', () => {
        it('should reset to default state', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.parameters = {
                baseLink: 5,
                eeLink: 8,
                ikType: 'translation3d'
            };
            mockElements.baseLinkInput.value = '5';
            mockElements.eeLinkInput.value = '8';
            mockElements.ikTypeSelect.value = 'translation3d';
            
            parameterConfig.reset();
            
            expect(parameterConfig.parameters.baseLink).toBeNull();
            expect(parameterConfig.parameters.eeLink).toBeNull();
            expect(parameterConfig.parameters.ikType).toBe('transform6d');
            expect(mockElements.baseLinkInput.value).toBe('');
            expect(mockElements.eeLinkInput.value).toBe('');
            expect(mockElements.ikTypeSelect.value).toBe('transform6d');
        });

        it('should clear validation errors on reset', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.validationErrors = {
                baseLink: 'Error',
                eeLink: 'Error'
            };
            
            parameterConfig.reset();
            
            expect(Object.keys(parameterConfig.validationErrors).length).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero as valid link index', () => {
            const params = {
                baseLink: 0,
                eeLink: 1,
                ikType: 'transform6d'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(true);
        });

        it('should handle large link indices', () => {
            const params = {
                baseLink: 0,
                eeLink: 999,
                ikType: 'transform6d'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(true);
        });

        it('should reject when both links are zero', () => {
            const params = {
                baseLink: 0,
                eeLink: 0,
                ikType: 'transform6d'
            };
            
            const result = parameterConfig.validateParameters(params);
            
            expect(result.valid).toBe(false);
            expect(result.errors.general).toBeTruthy();
        });

        it('should handle validation without UI elements', () => {
            // Don't initialize UI
            const result = parameterConfig.validateLinkIndex(5);
            
            expect(result.valid).toBe(true);
        });

        it('should handle setting parameters without UI elements', () => {
            // Don't initialize UI
            parameterConfig.setParameters({ baseLink: 5 });
            
            expect(parameterConfig.parameters.baseLink).toBe(5);
        });
    });

    describe('Validation Timing', () => {
        it('should validate on blur event', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.parameters.baseLink = -1;
            
            const isValid = parameterConfig.validateBaseLink();
            
            expect(isValid).toBe(false);
            expect(parameterConfig.validationErrors.baseLink).toBeTruthy();
        });

        it('should clear error on input change', () => {
            parameterConfig.initializeUI(mockElements);
            parameterConfig.validationErrors.baseLink = 'Some error';
            mockElements.baseLinkInput.value = '5';
            
            parameterConfig.handleBaseLinkChange();
            
            expect(parameterConfig.validationErrors.baseLink).toBeUndefined();
        });
    });
});
