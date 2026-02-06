import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ParameterConfigComponent } from '../web/parameter-config.module.js';

describe('ParameterConfigComponent - Property-Based Tests', () => {
    let parameterConfig;

    beforeEach(() => {
        parameterConfig = new ParameterConfigComponent();
    });

    describe('Property 11: Parameter Validation', () => {
        it('should accept only non-negative integers for link indices', () => {
            // Tag: Feature: ikfast-online-generator, Property 11: Parameter validation
            // Validates: Requirements 3.2
            fc.assert(
                fc.property(fc.anything(), (input) => {
                    const result = parameterConfig.validateLinkIndex(input);
                    const isValid = Number.isInteger(input) && input >= 0;
                    
                    // Property: validation result should match whether input is a non-negative integer
                    return result.valid === isValid;
                }),
                { numRuns: 100 }
            );
        });

        it('should reject null and undefined values', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant(null),
                        fc.constant(undefined)
                    ),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: null and undefined should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject negative integers', () => {
            fc.assert(
                fc.property(
                    fc.integer({ max: -1 }),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: negative integers should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should accept zero and positive integers', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000 }),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: zero and positive integers should always be valid
                        return result.valid === true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject non-integer numbers', () => {
            fc.assert(
                fc.property(
                    fc.double({ noNaN: true, noDefaultInfinity: true }).filter(n => !Number.isInteger(n)),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: non-integer numbers should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject strings', () => {
            fc.assert(
                fc.property(
                    fc.string(),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: strings should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject booleans', () => {
            fc.assert(
                fc.property(
                    fc.boolean(),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: booleans should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject arrays', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.anything()),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: arrays should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject objects', () => {
            fc.assert(
                fc.property(
                    fc.object(),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: objects should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle boundary cases', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: -10, max: 10 }),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        const expectedValid = input >= 0;
                        
                        // Property: validation should correctly handle boundary cases around zero
                        return result.valid === expectedValid;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle large positive integers', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: large positive integers should be valid
                        return result.valid === true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should provide error messages for invalid inputs', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.integer({ max: -1 }),
                        fc.string(),
                        fc.double({ noNaN: true, noDefaultInfinity: true }).filter(n => !Number.isInteger(n))
                    ),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: invalid inputs should have an error message
                        return result.valid === false && typeof result.error === 'string' && result.error.length > 0;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should not provide error messages for valid inputs', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000 }),
                    (input) => {
                        const result = parameterConfig.validateLinkIndex(input);
                        
                        // Property: valid inputs should not have an error message
                        return result.valid === true && result.error === undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 11 Extended: IKType Validation', () => {
        it('should accept only valid iktype values', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.string(),
                    (input) => {
                        const result = parameterConfig.validateIkType(input);
                        const isValid = validTypes.includes(input);
                        
                        // Property: validation result should match whether input is in valid types list
                        return result.valid === isValid;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should accept all predefined iktype options', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.constantFrom(...validTypes),
                    (input) => {
                        const result = parameterConfig.validateIkType(input);
                        
                        // Property: all predefined iktype values should be valid
                        return result.valid === true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject null and undefined iktype values', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant(null),
                        fc.constant(undefined)
                    ),
                    (input) => {
                        const result = parameterConfig.validateIkType(input);
                        
                        // Property: null and undefined should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject non-string iktype values', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.integer(),
                        fc.boolean(),
                        fc.array(fc.anything()),
                        fc.object()
                    ),
                    (input) => {
                        const result = parameterConfig.validateIkType(input);
                        
                        // Property: non-string values should always be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject empty string iktype', () => {
            const result = parameterConfig.validateIkType('');
            
            // Property: empty string should be invalid
            expect(result.valid).toBe(false);
        });

        it('should reject random invalid iktype strings', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }).filter(s => !validTypes.includes(s)),
                    (input) => {
                        const result = parameterConfig.validateIkType(input);
                        
                        // Property: strings not in valid types list should be invalid
                        return result.valid === false;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 11 Extended: Full Parameter Validation', () => {
        it('should validate complete parameter sets correctly', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        baseLink: fc.anything(),
                        eeLink: fc.anything(),
                        ikType: fc.anything()
                    }),
                    (params) => {
                        const result = parameterConfig.validateParameters(params);
                        
                        // Determine expected validity
                        const baseLinkValid = Number.isInteger(params.baseLink) && params.baseLink >= 0;
                        const eeLinkValid = Number.isInteger(params.eeLink) && params.eeLink >= 0;
                        const notEqual = params.baseLink !== params.eeLink;
                        const validTypes = CONFIG.IK_TYPES.map(t => t.value);
                        const ikTypeValid = typeof params.ikType === 'string' && validTypes.includes(params.ikType);
                        
                        const expectedValid = baseLinkValid && eeLinkValid && notEqual && ikTypeValid;
                        
                        // Property: validation result should match expected validity
                        return result.valid === expectedValid;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should provide errors object when validation fails', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        baseLink: fc.oneof(fc.constant(null), fc.string(), fc.integer({ max: -1 })),
                        eeLink: fc.oneof(fc.constant(null), fc.string(), fc.integer({ max: -1 })),
                        ikType: fc.oneof(fc.constant(null), fc.integer(), fc.string())
                    }),
                    (params) => {
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when validation fails, errors object should exist and be non-empty
                        if (!result.valid) {
                            return typeof result.errors === 'object' && Object.keys(result.errors).length > 0;
                        }
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should not provide errors when validation succeeds', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.record({
                        baseLink: fc.integer({ min: 0, max: 100 }),
                        eeLink: fc.integer({ min: 0, max: 100 }),
                        ikType: fc.constantFrom(...validTypes)
                    }).filter(p => p.baseLink !== p.eeLink),
                    (params) => {
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when validation succeeds, errors object should be empty
                        return result.valid === true && Object.keys(result.errors).length === 0;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 12: Invalid Parameter Rejection', () => {
        it('should reject parameters where base_link equals ee_link', () => {
            // Tag: Feature: ikfast-online-generator, Property 12: Invalid parameter rejection
            // Validates: Requirements 3.5, 17.5
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100 }),
                    fc.constantFrom(...validTypes),
                    (linkIndex, ikType) => {
                        const params = {
                            baseLink: linkIndex,
                            eeLink: linkIndex,  // Same as baseLink
                            ikType: ikType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when base_link equals ee_link, validation should fail
                        return result.valid === false && result.errors.general !== undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject parameters with invalid iktype', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100 }),
                    fc.integer({ min: 0, max: 100 }).filter(ee => ee !== 0), // Different from baseLink
                    fc.string().filter(s => !validTypes.includes(s) && s.length > 0),
                    (baseLink, eeLink, invalidIkType) => {
                        const params = {
                            baseLink: baseLink,
                            eeLink: eeLink,
                            ikType: invalidIkType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when iktype is invalid, validation should fail
                        return result.valid === false && result.errors.ikType !== undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject parameters with invalid base_link', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.integer({ max: -1 }),
                        fc.string(),
                        fc.double({ noNaN: true, noDefaultInfinity: true }).filter(n => !Number.isInteger(n))
                    ),
                    fc.integer({ min: 0, max: 100 }),
                    fc.constantFrom(...validTypes),
                    (invalidBaseLink, eeLink, ikType) => {
                        const params = {
                            baseLink: invalidBaseLink,
                            eeLink: eeLink,
                            ikType: ikType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when base_link is invalid, validation should fail
                        return result.valid === false && result.errors.baseLink !== undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject parameters with invalid ee_link', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100 }),
                    fc.oneof(
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.integer({ max: -1 }),
                        fc.string(),
                        fc.double({ noNaN: true, noDefaultInfinity: true }).filter(n => !Number.isInteger(n))
                    ),
                    fc.constantFrom(...validTypes),
                    (baseLink, invalidEeLink, ikType) => {
                        const params = {
                            baseLink: baseLink,
                            eeLink: invalidEeLink,
                            ikType: ikType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when ee_link is invalid, validation should fail
                        return result.valid === false && result.errors.eeLink !== undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject parameters with multiple validation errors', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant(null),
                        fc.integer({ max: -1 }),
                        fc.string()
                    ),
                    fc.oneof(
                        fc.constant(null),
                        fc.integer({ max: -1 }),
                        fc.string()
                    ),
                    fc.oneof(
                        fc.constant(null),
                        fc.integer(),
                        fc.string().filter(s => {
                            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
                            return !validTypes.includes(s);
                        })
                    ),
                    (invalidBaseLink, invalidEeLink, invalidIkType) => {
                        const params = {
                            baseLink: invalidBaseLink,
                            eeLink: invalidEeLink,
                            ikType: invalidIkType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when multiple parameters are invalid, validation should fail with multiple errors
                        return result.valid === false && Object.keys(result.errors).length > 0;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should provide specific error messages for each invalid parameter', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        baseLink: fc.oneof(fc.constant(null), fc.integer({ max: -1 })),
                        eeLink: fc.oneof(fc.constant(null), fc.integer({ max: -1 })),
                        ikType: fc.constant(null)
                    }),
                    (params) => {
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: each invalid parameter should have a specific error message
                        if (!result.valid) {
                            const hasErrorMessages = Object.values(result.errors).every(
                                error => typeof error === 'string' && error.length > 0
                            );
                            return hasErrorMessages;
                        }
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should not reject valid parameters with different base_link and ee_link', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100 }),
                    fc.integer({ min: 0, max: 100 }),
                    fc.constantFrom(...validTypes),
                    (baseLink, eeLink, ikType) => {
                        // Skip if base_link equals ee_link
                        if (baseLink === eeLink) {
                            return true;
                        }
                        
                        const params = {
                            baseLink: baseLink,
                            eeLink: eeLink,
                            ikType: ikType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: valid parameters with different links should pass validation
                        return result.valid === true && Object.keys(result.errors).length === 0;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle edge case where base_link is 0 and ee_link is different', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 100 }),
                    fc.constantFrom(...validTypes),
                    (eeLink, ikType) => {
                        const params = {
                            baseLink: 0,
                            eeLink: eeLink,
                            ikType: ikType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: base_link of 0 with different ee_link should be valid
                        return result.valid === true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle edge case where ee_link is 0 and base_link is different', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 100 }),
                    fc.constantFrom(...validTypes),
                    (baseLink, ikType) => {
                        const params = {
                            baseLink: baseLink,
                            eeLink: 0,
                            ikType: ikType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: ee_link of 0 with different base_link should be valid
                        return result.valid === true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject when both links are 0', () => {
            const validTypes = CONFIG.IK_TYPES.map(t => t.value);
            
            fc.assert(
                fc.property(
                    fc.constantFrom(...validTypes),
                    (ikType) => {
                        const params = {
                            baseLink: 0,
                            eeLink: 0,
                            ikType: ikType
                        };
                        
                        const result = parameterConfig.validateParameters(params);
                        
                        // Property: when both links are 0, validation should fail
                        return result.valid === false && result.errors.general !== undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
