/**
 * Property-Based Tests for LinkInfoComponent
 * Tests universal properties that should hold across all inputs
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { LinkInfoComponent } from '../web/link-info.module.js';

describe('LinkInfoComponent - Property-Based Tests', () => {
    
    /**
     * Property 8: Link Information Parsing
     * For any output from openrave-robot.py --info links, the system should parse
     * and extract link index, name, and parent information for all links
     * Validates: Requirements 2.3, 16.1
     */
    describe('Property 8: Link Information Parsing', () => {
        it('should correctly parse all links from generated OpenRAVE output', () => {
            fc.assert(
                fc.property(
                    // Generate an array of link data
                    fc.array(
                        fc.record({
                            name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/), // Valid link names
                            index: fc.nat(100), // Link indices 0-100
                            parent: fc.option(fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/), { nil: null })
                        }),
                        { minLength: 1, maxLength: 20 }
                    ),
                    (links) => {
                        // Ensure unique indices
                        const uniqueLinks = [];
                        const seenIndices = new Set();
                        
                        for (const link of links) {
                            if (!seenIndices.has(link.index)) {
                                seenIndices.add(link.index);
                                uniqueLinks.push(link);
                            }
                        }
                        
                        if (uniqueLinks.length === 0) {
                            return true; // Skip empty cases
                        }
                        
                        // Generate OpenRAVE-style output
                        const output = generateLinkInfoOutput(uniqueLinks);
                        
                        // Create component and parse
                        const component = new LinkInfoComponent(null);
                        const parsed = component.parseLinkInfo(output);
                        
                        // Verify all links were parsed
                        if (parsed.length !== uniqueLinks.length) {
                            return false;
                        }
                        
                        // Verify each link's data is correct
                        for (let i = 0; i < uniqueLinks.length; i++) {
                            const original = uniqueLinks[i];
                            const parsedLink = parsed.find(p => p.index === original.index);
                            
                            if (!parsedLink) {
                                return false;
                            }
                            
                            // Check name matches
                            if (parsedLink.name !== original.name) {
                                return false;
                            }
                            
                            // Check parent matches
                            if (parsedLink.parent !== original.parent) {
                                return false;
                            }
                            
                            // Check index matches
                            if (parsedLink.index !== original.index) {
                                return false;
                            }
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should handle empty or malformed output gracefully', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant(''),
                        fc.constant('no link info here'),
                        fc.constant('=== STEP 1 ===\nsome other content'),
                        fc.string()
                    ),
                    (output) => {
                        const component = new LinkInfoComponent(null);
                        const parsed = component.parseLinkInfo(output);
                        
                        // Should return an array (possibly empty)
                        return Array.isArray(parsed);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should correctly identify root and leaf links', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            name: fc.stringMatching(/^link[0-9]+$/),
                            index: fc.nat(50),
                            parent: fc.option(fc.stringMatching(/^link[0-9]+$/), { nil: null })
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                    (links) => {
                        // Ensure unique indices
                        const uniqueLinks = [];
                        const seenIndices = new Set();
                        
                        for (const link of links) {
                            if (!seenIndices.has(link.index)) {
                                seenIndices.add(link.index);
                                uniqueLinks.push(link);
                            }
                        }
                        
                        if (uniqueLinks.length < 2) {
                            return true; // Skip cases with too few links
                        }
                        
                        // Generate output
                        const output = generateLinkInfoOutput(uniqueLinks);
                        
                        // Parse
                        const component = new LinkInfoComponent(null);
                        const parsed = component.parseLinkInfo(output);
                        
                        // Verify root links (no parent)
                        for (const link of parsed) {
                            if (link.parent === null && !link.isRoot) {
                                return false;
                            }
                            if (link.parent !== null && link.isRoot) {
                                return false;
                            }
                        }
                        
                        // Verify leaf links (no children)
                        const childrenMap = new Map();
                        for (const link of parsed) {
                            if (link.parent) {
                                if (!childrenMap.has(link.parent)) {
                                    childrenMap.set(link.parent, []);
                                }
                                childrenMap.get(link.parent).push(link.name);
                            }
                        }
                        
                        for (const link of parsed) {
                            const hasChildren = childrenMap.has(link.name) && childrenMap.get(link.name).length > 0;
                            if (hasChildren && link.isLeaf) {
                                return false;
                            }
                            if (!hasChildren && !link.isLeaf) {
                                return false;
                            }
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
    
    /**
     * Property 9: Link Table Display
     * For any parsed link information, the system should render a table with columns
     * for Index, Name, and Parent, and highlight root links (no parent) and leaf links (no children)
     * Validates: Requirements 2.4, 16.2, 16.3, 16.4
     */
    describe('Property 9: Link Table Display', () => {
        it('should render table with correct structure for any link data', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
                            index: fc.nat(100),
                            parent: fc.option(fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/), { nil: null })
                        }),
                        { minLength: 1, maxLength: 15 }
                    ),
                    (rawLinks) => {
                        // Ensure isRoot and isLeaf are consistent with parent relationships
                        // Build children map
                        const childrenMap = new Map();
                        for (const link of rawLinks) {
                            if (link.parent) {
                                if (!childrenMap.has(link.parent)) {
                                    childrenMap.set(link.parent, []);
                                }
                                childrenMap.get(link.parent).push(link.name);
                            }
                        }
                        
                        // Add isRoot and isLeaf properties consistently
                        const links = rawLinks.map(link => ({
                            ...link,
                            isRoot: link.parent === null,
                            isLeaf: !childrenMap.has(link.name) || childrenMap.get(link.name).length === 0
                        }));
                        
                        // Create a mock DOM environment
                        const container = document.createElement('div');
                        
                        // Create component
                        const component = new LinkInfoComponent(null);
                        component.initializeUI({
                            linkTable: container
                        });
                        
                        // Render table
                        component.renderLinkTable(links);
                        
                        // Verify table exists
                        const table = container.querySelector('table.link-table');
                        if (!table) {
                            return false;
                        }
                        
                        // Verify header has 3 columns: Index, Name, Parent
                        const headers = table.querySelectorAll('thead th');
                        if (headers.length !== 3) {
                            return false;
                        }
                        
                        const headerTexts = Array.from(headers).map(h => h.textContent);
                        if (!headerTexts.includes('Index') || !headerTexts.includes('Name') || !headerTexts.includes('Parent')) {
                            return false;
                        }
                        
                        // Verify each link has a row
                        const rows = table.querySelectorAll('tbody tr.link-row');
                        if (rows.length !== links.length) {
                            return false;
                        }
                        
                        // Verify each row has correct data
                        for (let i = 0; i < links.length; i++) {
                            const link = links[i];
                            const row = rows[i];
                            
                            // Check cells
                            const cells = row.querySelectorAll('td');
                            if (cells.length !== 3) {
                                return false;
                            }
                            
                            // Verify index
                            if (parseInt(cells[0].textContent) !== link.index) {
                                return false;
                            }
                            
                            // Verify name
                            if (cells[1].textContent !== link.name) {
                                return false;
                            }
                            
                            // Verify parent
                            const expectedParent = link.parent || '(none)';
                            if (cells[2].textContent !== expectedParent) {
                                return false;
                            }
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should apply root-link class to links with no parent', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            name: fc.stringMatching(/^link[0-9]+$/),
                            index: fc.nat(50),
                            parent: fc.option(fc.stringMatching(/^link[0-9]+$/), { nil: null }),
                            isRoot: fc.boolean(),
                            isLeaf: fc.boolean()
                        }),
                        { minLength: 1, maxLength: 10 }
                    ),
                    (links) => {
                        // Ensure isRoot matches parent === null
                        const correctedLinks = links.map(link => ({
                            ...link,
                            isRoot: link.parent === null
                        }));
                        
                        // Create mock DOM
                        const container = document.createElement('div');
                        const component = new LinkInfoComponent(null);
                        component.initializeUI({ linkTable: container });
                        
                        // Render
                        component.renderLinkTable(correctedLinks);
                        
                        // Verify root links have root-link class
                        const rows = container.querySelectorAll('tbody tr.link-row');
                        
                        for (let i = 0; i < correctedLinks.length; i++) {
                            const link = correctedLinks[i];
                            const row = rows[i];
                            
                            if (link.isRoot && !row.classList.contains('root-link')) {
                                return false;
                            }
                            if (!link.isRoot && row.classList.contains('root-link')) {
                                return false;
                            }
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should apply leaf-link class to links with no children', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            name: fc.stringMatching(/^link[0-9]+$/),
                            index: fc.nat(50),
                            parent: fc.option(fc.stringMatching(/^link[0-9]+$/), { nil: null }),
                            isRoot: fc.boolean(),
                            isLeaf: fc.boolean()
                        }),
                        { minLength: 1, maxLength: 10 }
                    ),
                    (links) => {
                        // Create mock DOM
                        const container = document.createElement('div');
                        const component = new LinkInfoComponent(null);
                        component.initializeUI({ linkTable: container });
                        
                        // Render
                        component.renderLinkTable(links);
                        
                        // Verify leaf links have leaf-link class
                        const rows = container.querySelectorAll('tbody tr.link-row');
                        
                        for (let i = 0; i < links.length; i++) {
                            const link = links[i];
                            const row = rows[i];
                            
                            if (link.isLeaf && !row.classList.contains('leaf-link')) {
                                return false;
                            }
                            if (!link.isLeaf && row.classList.contains('leaf-link')) {
                                return false;
                            }
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
    
    /**
     * Property 10: Link Selection Auto-fill
     * For any link row clicked by the user, the system should auto-fill the
     * corresponding link index into the appropriate input field
     * Validates: Requirements 16.5
     */
    describe('Property 10: Link Selection Auto-fill', () => {
        it('should dispatch linkSelected event with correct data when link is clicked', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
                            index: fc.nat(100),
                            parent: fc.option(fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/), { nil: null }),
                            isRoot: fc.boolean(),
                            isLeaf: fc.boolean()
                        }),
                        { minLength: 1, maxLength: 10 }
                    ),
                    fc.nat(9), // Select a link by index in the array
                    (rawLinks, selectedIndex) => {
                        // Ensure unique indices (link indices must be unique in robot models)
                        const links = [];
                        const seenIndices = new Set();
                        
                        for (const link of rawLinks) {
                            if (!seenIndices.has(link.index)) {
                                seenIndices.add(link.index);
                                links.push(link);
                            }
                        }
                        
                        if (links.length === 0 || selectedIndex >= links.length) {
                            return true; // Skip invalid cases
                        }
                        
                        // Create mock DOM
                        const container = document.createElement('div');
                        const component = new LinkInfoComponent(null);
                        component.initializeUI({ linkTable: container });
                        
                        // Render table
                        component.renderLinkTable(links);
                        
                        // Set up event listener to capture the event
                        let eventFired = false;
                        let eventDetail = null;
                        
                        const eventListener = (e) => {
                            eventFired = true;
                            eventDetail = e.detail;
                        };
                        
                        window.addEventListener('linkSelected', eventListener);
                        
                        // Click on the selected link row
                        const rows = container.querySelectorAll('tbody tr.link-row');
                        if (rows.length > selectedIndex) {
                            rows[selectedIndex].click();
                        }
                        
                        // Clean up
                        window.removeEventListener('linkSelected', eventListener);
                        
                        // Verify event was fired
                        if (!eventFired) {
                            return false;
                        }
                        
                        // Verify event detail contains correct link data
                        const expectedLink = links[selectedIndex];
                        
                        if (eventDetail.index !== expectedLink.index) {
                            return false;
                        }
                        
                        if (eventDetail.name !== expectedLink.name) {
                            return false;
                        }
                        
                        if (eventDetail.isRoot !== expectedLink.isRoot) {
                            return false;
                        }
                        
                        if (eventDetail.isLeaf !== expectedLink.isLeaf) {
                            return false;
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should highlight the selected row when clicked', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            name: fc.stringMatching(/^link[0-9]+$/),
                            index: fc.nat(50),
                            parent: fc.option(fc.stringMatching(/^link[0-9]+$/), { nil: null }),
                            isRoot: fc.boolean(),
                            isLeaf: fc.boolean()
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                    fc.nat(9),
                    (rawLinks, selectedIndex) => {
                        // Ensure unique indices (link indices must be unique in robot models)
                        const links = [];
                        const seenIndices = new Set();
                        
                        for (const link of rawLinks) {
                            if (!seenIndices.has(link.index)) {
                                seenIndices.add(link.index);
                                links.push(link);
                            }
                        }
                        
                        if (links.length < 2 || selectedIndex >= links.length) {
                            return true; // Skip invalid cases
                        }
                        
                        // Create mock DOM
                        const container = document.createElement('div');
                        const component = new LinkInfoComponent(null);
                        component.initializeUI({ linkTable: container });
                        
                        // Render table
                        component.renderLinkTable(links);
                        
                        // Click on the selected link row
                        const rows = container.querySelectorAll('tbody tr.link-row');
                        rows[selectedIndex].click();
                        
                        // Verify the selected row has 'selected' class
                        if (!rows[selectedIndex].classList.contains('selected')) {
                            return false;
                        }
                        
                        // Verify other rows don't have 'selected' class
                        for (let i = 0; i < rows.length; i++) {
                            if (i !== selectedIndex && rows[i].classList.contains('selected')) {
                                return false;
                            }
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

/**
 * Helper function to generate OpenRAVE-style link info output
 * @param {Array} links - Array of link objects
 * @returns {string} Formatted output
 */
function generateLinkInfoOutput(links) {
    let output = '=== STEP 2: Extract Link Information ===\n';
    output += 'openrave-robot.py robot.dae --info links\n';
    output += 'name index parents\n';
    
    for (const link of links) {
        const parentInfo = link.parent ? `${link.parent}(${links.find(l => l.name === link.parent)?.index || 0})` : '';
        output += `${link.name} ${link.index} ${parentInfo}\n`;
    }
    
    output += '=== INFO MODE COMPLETE ===\n';
    
    return output;
}
